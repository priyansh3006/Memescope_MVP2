package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/sns"
	"github.com/aws/aws-sdk-go/service/ssm"
	"github.com/gorilla/websocket"
)

// Initialize AWS Session
var awsSession = session.Must(session.NewSession(&aws.Config{
	Region: aws.String("us-east-1"), // Will Change if using a different region
}))

// Fetch Pulumi-managed resources from SSM
var dynamoDBTable = getPulumiParameter("dynamoDbTableName")
var snsTopicArn = getPulumiParameter("snsTopicArn")
var logGroupName = getPulumiParameter("cloudWatchLogGroup")

var dynamoDB = dynamodb.New(awsSession)
var snsClient = sns.New(awsSession)
var cloudWatchClient = cloudwatchlogs.New(awsSession)

// WebSocket Config
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

var clients = make(map[*websocket.Conn]bool)
var mutex = sync.Mutex{}

// CloudWatch Log Stream Name
var logStreamName = fmt.Sprintf("log-stream-%d", time.Now().Unix())

// Trade Action Struct
type TradeAction struct {
	TradeID   string  `json:"tradeId"`
	Timestamp string  `json:"timestamp"`
	Price     float64 `json:"price"`
	Volume    int     `json:"volume"`
	Trader    string  `json:"trader"`
	Action    string  `json:"action"`
}

// Fetch Pulumi-exported parameters from AWS SSM Parameter Store
func getPulumiParameter(paramName string) string {
	ssmClient := ssm.New(awsSession)
	param, err := ssmClient.GetParameter(&ssm.GetParameterInput{
		Name:           aws.String(paramName),
		WithDecryption: aws.Bool(true),
	})

	if err != nil {
		log.Fatalf("Failed to get parameter %s: %v", paramName, err)
	}

	return *param.Parameter.Value
}

// Initialize CloudWatch Log Stream
func createLogStream() {
	fmt.Println(logGroupName)
	_, err := cloudWatchClient.CreateLogStream(&cloudwatchlogs.CreateLogStreamInput{
		LogGroupName:  aws.String(logGroupName),
		LogStreamName: aws.String(logStreamName),
	})

	if err != nil {
		log.Fatalf("Failed to create CloudWatch log stream: %v", err)
	}
}

// Log message to CloudWatch Logs
func logToCloudWatch(message string) {
	timestamp := time.Now().UnixNano() / int64(time.Millisecond)

	_, err := cloudWatchClient.PutLogEvents(&cloudwatchlogs.PutLogEventsInput{
		LogGroupName:  aws.String(logGroupName),
		LogStreamName: aws.String(logStreamName),
		LogEvents: []*cloudwatchlogs.InputLogEvent{
			{
				Message:   aws.String(message),
				Timestamp: aws.Int64(timestamp),
			},
		},
	})

	if err != nil {
		log.Printf("Failed to send log to CloudWatch: %v", err)
	}
}

// WebSocket Handler
func handleConnections(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logToCloudWatch(fmt.Sprintf("WebSocket Upgrade Error: %v", err))
		return
	}
	defer conn.Close()

	mutex.Lock()
	clients[conn] = true
	mutex.Unlock()

	logToCloudWatch("New WebSocket connection established")

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			logToCloudWatch("Client disconnected")
			mutex.Lock()
			delete(clients, conn)
			mutex.Unlock()
			break
		}

		var trade TradeAction
		if err := json.Unmarshal(msg, &trade); err != nil {
			logToCloudWatch(fmt.Sprintf("Invalid trade action format: %v", err))
			continue
		}

		trade.TradeID = fmt.Sprintf("%d", time.Now().UnixNano())
		trade.Timestamp = time.Now().Format(time.RFC3339)

		// Save Trade Action in DynamoDB
		go saveTradeToDynamoDB(trade)

		// Broadcast trade action to WebSocket clients
		broadcastTrade(trade)
	}
}

// Save Trade Action to DynamoDB
func saveTradeToDynamoDB(trade TradeAction) {
	_, err := dynamoDB.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(dynamoDBTable),
		Item: map[string]*dynamodb.AttributeValue{
			"TradeID":   {S: aws.String(trade.TradeID)},
			"Timestamp": {S: aws.String(trade.Timestamp)},
			"Price":     {N: aws.String(fmt.Sprintf("%.2f", trade.Price))},
			"Volume":    {N: aws.String(fmt.Sprintf("%d", trade.Volume))},
			"Trader":    {S: aws.String(trade.Trader)},
			"Action":    {S: aws.String(trade.Action)},
		},
	})
	if err != nil {
		logToCloudWatch(fmt.Sprintf("Error saving trade to DynamoDB: %v", err))
		return
	}

	// Publish Trade Action to SNS
	publishTradeToSNS(trade)
}

// Publish Trade Action to SNS
func publishTradeToSNS(trade TradeAction) {
	data, _ := json.Marshal(trade)
	_, err := snsClient.Publish(&sns.PublishInput{
		TopicArn: aws.String(snsTopicArn),
		Message:  aws.String(string(data)),
	})
	if err != nil {
		logToCloudWatch(fmt.Sprintf("Error publishing to SNS: %v", err))
	}
}

// Broadcast Trade Action to WebSocket Clients
func broadcastTrade(trade TradeAction) {
	data, _ := json.Marshal(trade)
	mutex.Lock()
	defer mutex.Unlock()

	for client := range clients {
		err := client.WriteMessage(websocket.TextMessage, data)
		if err != nil {
			logToCloudWatch(fmt.Sprintf("WebSocket Write Error: %v", err))
			client.Close()
			delete(clients, client)
		}
	}
}

// Start WebSocket Server
func main() {
	createLogStream() // Ensure log stream is created before logging
	logToCloudWatch("Starting WebSocket server...")

	http.HandleFunc("/ws", handleConnections)

	port := ":8080"
	logToCloudWatch(fmt.Sprintf("WebSocket server running on port %s", port))
	log.Fatal(http.ListenAndServe(port, nil))
}
