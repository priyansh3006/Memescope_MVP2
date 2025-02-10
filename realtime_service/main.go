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
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/sns"
	"github.com/aws/aws-sdk-go/service/ssm"
	"github.com/gorilla/websocket"
)

// Initialize AWS Session
var awsSession = session.Must(session.NewSession(&aws.Config{
	Region: aws.String("us-east-1"),
}))

// Fetch Pulumi-managed resources
var dynamoDBTable = getPulumiParameter("dynamoDbTableName") // DynamoDB Table provisioned via Pulumi
var snsTopicArn = getPulumiParameter("snsTopicArn")         // SNS Topic provisioned via Pulumi

var dynamoDB = dynamodb.New(awsSession)
var snsClient = sns.New(awsSession)

// WebSocket Config
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

var clients = make(map[*websocket.Conn]bool)
var mutex = sync.Mutex{}

// Trade Action Struct
type TradeAction struct {
	TradeID   string  `json:"tradeId"`
	Timestamp string  `json:"timestamp"`
	Price     float64 `json:"price"`
	Volume    int     `json:"volume"`
	Trader    string  `json:"trader"`
	Action    string  `json:"action"`
}

// Function to fetch Pulumi resource outputs from AWS SSM Parameter Store
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

// WebSocket Handler
func handleConnections(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket Upgrade Error:", err)
		return
	}
	defer conn.Close()

	mutex.Lock()
	clients[conn] = true
	mutex.Unlock()

	log.Println("New WebSocket connection")

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Client disconnected")
			mutex.Lock()
			delete(clients, conn)
			mutex.Unlock()
			break
		}

		var trade TradeAction
		if err := json.Unmarshal(msg, &trade); err != nil {
			log.Println("Invalid trade action format:", err)
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
		TableName: aws.String(dynamoDBTable), // Using Pulumi provisioned table
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
		log.Println("Error saving trade to DynamoDB:", err)
		return
	}

	// Publish Trade Action to SNS
	publishTradeToSNS(trade)
}

// Publish Trade Action to SNS
func publishTradeToSNS(trade TradeAction) {
	data, _ := json.Marshal(trade)
	_, err := snsClient.Publish(&sns.PublishInput{
		TopicArn: aws.String(snsTopicArn), // Using Pulumi provisioned SNS topic
		Message:  aws.String(string(data)),
	})
	if err != nil {
		log.Println("Error publishing to SNS:", err)
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
			log.Println("WebSocket Write Error:", err)
			client.Close()
			delete(clients, client)
		}
	}
}

// Start WebSocket Server
func main() {
	http.HandleFunc("/ws", handleConnections)

	port := ":8080"
	log.Println("WebSocket server running on port", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
