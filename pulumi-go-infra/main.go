package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/apigatewayv2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/dynamodb"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ecs"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/iam"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/lambda"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/sns"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ssm"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		//Starting the VPC service
		vpc, err := ec2.NewVpc(ctx, "memescopeVpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsSupport:   pulumi.Bool(true),
			EnableDnsHostnames: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// Starting the Internet Gateway for external communication
		igw, err := ec2.NewInternetGateway(ctx, "memescopeIgw", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
		})
		if err != nil {
			return err
		}

		// Starting the subnet1
		subnet1, err := ec2.NewSubnet(ctx, "memescopeSubnet1", &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.1.0/24"),
			MapPublicIpOnLaunch: pulumi.Bool(true), //public ip so instances can access internet
			AvailabilityZone:    pulumi.String("us-east-1a"),
		})
		if err != nil {
			return err
		}

		//Starting the subnet2
		subnet2, err := ec2.NewSubnet(ctx, "memescopeSubnet2", &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.2.0/24"),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			AvailabilityZone:    pulumi.String("us-east-1b"),
		})
		if err != nil {
			return err
		}

		// Intializing the Security Group
		//Needed for ecs service or api gateways for publi accessiblity
		securityGroup, err := ec2.NewSecurityGroup(ctx, "memescopeSG", &ec2.SecurityGroupArgs{
			VpcId: vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(8080),
					ToPort:     pulumi.Int(8080),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
		})
		if err != nil {
			return err
		}

		// Stating the  RDS PostgreSQL Database
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, "memescope-db-subnetgroup", &rds.SubnetGroupArgs{
			SubnetIds: pulumi.StringArray{subnet1.ID(), subnet2.ID()},
		})
		if err != nil {
			return err
		}

		// Route Table & Route Associations
		//Route table defines how network traffic is directed within  VPC
		routeTable, err := ec2.NewRouteTable(ctx, "memescopeRouteTable", &ec2.RouteTableArgs{
			VpcId: vpc.ID(),
			Routes: ec2.RouteTableRouteArray{
				&ec2.RouteTableRouteArgs{
					CidrBlock: pulumi.String("0.0.0.0/0"),
					GatewayId: igw.ID(),
				},
			},
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "memescopeRouteTableAssoc1", &ec2.RouteTableAssociationArgs{
			SubnetId:     subnet1.ID(),
			RouteTableId: routeTable.ID(),
		})
		if err != nil {
			return err
		}

		_, err = ec2.NewRouteTableAssociation(ctx, "memescopeRouteTableAssoc2", &ec2.RouteTableAssociationArgs{
			SubnetId:     subnet2.ID(),
			RouteTableId: routeTable.ID(),
		})
		if err != nil {
			return err
		}

		// Starting the  ECS Cluster
		ecsCluster, err := ecs.NewCluster(ctx, "memescopeCluster", &ecs.ClusterArgs{})
		if err != nil {
			return err
		}

		// ECS Task Definition(will have to modify this with real data)
		taskDefinition, err := ecs.NewTaskDefinition(ctx, "realTimeTaskDef", &ecs.TaskDefinitionArgs{
			Family:      pulumi.String("real-time-service"),
			Cpu:         pulumi.String("512"),
			Memory:      pulumi.String("1024"),
			NetworkMode: pulumi.String("awsvpc"),
			ContainerDefinitions: pulumi.String(fmt.Sprintf(`[{
				"name": "realtime-service",
				"image": "priyanshgupta3006/realtime-service:latest",
				"cpu": 512,
				"memory": 1024,
				"portMappings": [{"containerPort": 8080, "hostPort": 8080}]
			}]`)),
		})
		if err != nil {
			return err
		}

		// Staring the ECS Service
		service, err := ecs.NewService(ctx, "realTimeService", &ecs.ServiceArgs{
			Cluster:        ecsCluster.Arn,
			TaskDefinition: taskDefinition.Arn,
			DesiredCount:   pulumi.Int(1),
			LaunchType:     pulumi.String("FARGATE"),
			NetworkConfiguration: &ecs.ServiceNetworkConfigurationArgs{
				AssignPublicIp: pulumi.Bool(true),
				SecurityGroups: pulumi.StringArray{securityGroup.ID()},
				Subnets:        pulumi.StringArray{subnet1.ID(), subnet2.ID()},
			},
		})
		if err != nil {
			return err
		}

		//Starting the rds service(postgres)
		db, err := rds.NewInstance(ctx, "memescope-db", &rds.InstanceArgs{
			Engine:              pulumi.String("postgres"),
			InstanceClass:       pulumi.String("db.t3.micro"),
			AllocatedStorage:    pulumi.Int(20),
			DbName:              pulumi.String("memescope"),
			Username:            pulumi.String("memescope_user"),    //might change later
			Password:            pulumi.String("securepassword123"), //will change during the deployment
			SkipFinalSnapshot:   pulumi.Bool(true),
			DbSubnetGroupName:   dbSubnetGroup.Name,
			VpcSecurityGroupIds: pulumi.StringArray{securityGroup.ID()},
			PubliclyAccessible:  pulumi.Bool(false),
		})
		if err != nil {
			return err
		}

		// CloudWatch Log Group
		logGroup, err := cloudwatch.NewLogGroup(ctx, "memescopeLogGroup", &cloudwatch.LogGroupArgs{
			RetentionInDays: pulumi.Int(14),
		})
		if err != nil {
			return err
		}

		// Store CloudWatch Log Group in AWS SSM Parameter Store
		ssmParam, err := ssm.NewParameter(ctx, "cloudWatchLogGroup", &ssm.ParameterArgs{
			Name:  pulumi.String("cloudWatchLogGroup"),
			Type:  pulumi.String("String"),
			Value: logGroup.Name,
		})
		if err != nil {
			return err
		}

		// Intializing the  DynamoDB Table
		tradeTable, err := dynamodb.NewTable(ctx, "TradesTable", &dynamodb.TableArgs{
			Attributes: dynamodb.TableAttributeArray{
				&dynamodb.TableAttributeArgs{
					Name: pulumi.String("TradeID"),
					Type: pulumi.String("S"),
				},
			},
			BillingMode:    pulumi.String("PAY_PER_REQUEST"), //AWS charges only for the read/write requests made.
			HashKey:        pulumi.String("TradeID"),
			StreamEnabled:  pulumi.Bool(true),
			StreamViewType: pulumi.String("NEW_IMAGE"),
		})
		if err != nil {
			return err
		}

		// Creating SNS Topic
		tradeUpdatesTopic, err := sns.NewTopic(ctx, "TradeUpdatesTopic", &sns.TopicArgs{
			Name: pulumi.String("TradeUpdatesTopic"), // Explicitly setting a name
		})
		if err != nil {
			return err
		}

		// Force creation of the SSM Parameter by setting `ReplaceOnChanges`
		_, err = ssm.NewParameter(ctx, "snsTopicArn", &ssm.ParameterArgs{
			Name:      pulumi.String("snsTopicArn"),
			Type:      pulumi.String("String"),
			Value:     tradeUpdatesTopic.Arn,
			Overwrite: pulumi.Bool(true), // Ensures parameter is updated if it exists
			Tier:      pulumi.String("Standard"),
		})
		if err != nil {
			return err
		}

		//New IAM Role for Lambda
		//Doing because AWS Lambda needs permissions to access other AWS services
		lambdaRole, err := iam.NewRole(ctx, "lambdaExecutionRole", &iam.RoleArgs{
			AssumeRolePolicy: pulumi.String(`{
				"Version": "2012-10-17",
				"Statement": [{
					"Effect": "Allow",
					"Principal": {"Service": "lambda.amazonaws.com"},
					"Action": "sts:AssumeRole"
				}]
			}`),
		})
		if err != nil {
			return err
		}

		// Create IAM Role for SSM
		// 	ssmRole, err := iam.NewRole(ctx, "ec2SSMRole", &iam.RoleArgs{
		// 		AssumeRolePolicy: pulumi.String(`{
		//     	"Version": "2012-10-17",
		//     	"Statement": [{
		//         	"Effect": "Allow",
		//         	"Principal": {"Service": "ec2.amazonaws.com"},
		//         	"Action": "sts:AssumeRole"
		//     }]
		// }`),
		// 	})
		// 	if err != nil {
		// 		return err
		// 	}

		// Attach SSM Permissions
		//grants EC2 instances permissions to use AWS Systems Manager (SSM)
		_, err = iam.NewRolePolicyAttachment(ctx, "ssmCoreAttachment", &iam.RolePolicyAttachmentArgs{
			Role:      pulumi.String("ec2SSMRole-1835f81"),
			PolicyArn: pulumi.String("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"),
		})
		if err != nil {
			return err
		}

		// Attach IAM Role to EC2
		_, err = ec2.NewInstance(ctx, "bastionHost", &ec2.InstanceArgs{
			InstanceType: pulumi.String("t3.micro"),
			Ami:          pulumi.String("ami-0c104f6f4a5d9d1d5"), // will Replace with a valid Amazon Linux AMI
			SubnetId:     subnet1.ID(),
			VpcSecurityGroupIds: pulumi.StringArray{
				securityGroup.ID(),
			},
			IamInstanceProfile: pulumi.String("ec2SSMInstanceProfile"),
		})
		if err != nil {
			return err
		}

		//New Lambda Function for WebSocket
		//Will have to check later and might update the .zip file
		websocketLambda, err := lambda.NewFunction(ctx, "WebSocketHandler", &lambda.FunctionArgs{
			Runtime: pulumi.String("provided.al2"), //Amazon Linux 2 (AL2) runtime with a custom execution environment.Required when using a custom runtime, such as Go
			Handler: pulumi.String("main"),
			Role:    lambdaRole.Arn,
			Code:    pulumi.NewFileArchive("./realtime_service.zip"),
		})
		if err != nil {
			return err
		}

		// New API Gateway WebSocket API
		apiGateway, err := apigatewayv2.NewApi(ctx, "TradeWebSocketAPI", &apigatewayv2.ApiArgs{
			ProtocolType:             pulumi.String("WEBSOCKET"),
			RouteSelectionExpression: pulumi.String("$request.body.action"),
		})
		if err != nil {
			return err
		}

		// Exporting the  Outputs
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("subnet1Id", subnet1.ID())
		ctx.Export("subnet2Id", subnet2.ID())
		ctx.Export("securityGroupId", securityGroup.ID())
		ctx.Export("dynamoDbTableName", tradeTable.Name)
		ctx.Export("snsTopicArn", tradeUpdatesTopic.Arn)
		ctx.Export("websocketLambdaArn", websocketLambda.Arn)
		ctx.Export("apiGatewayUrl", apiGateway.ApiEndpoint)
		ctx.Export("dbEndpoint", db.Endpoint)
		ctx.Export("ecsClusterArn", ecsCluster.Arn)
		ctx.Export("realTimeServiceID", service.ID())
		ctx.Export("realTimeServiceName", service.Name)
		ctx.Export("awsRegion", pulumi.String("us-east-1"))
		ctx.Export("cloudWatchLogGroup", ssmParam.Name)

		return nil
	})
}
