package main

import (
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/dynamodb"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/sns"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Starting VPC
		vpc, err := ec2.NewVpc(ctx, "memescopeVpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsSupport:   pulumi.Bool(true),
			EnableDnsHostnames: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// Starting Internet Gateway
		igw, err := ec2.NewInternetGateway(ctx, "memescopeIgw", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
		})
		if err != nil {
			return err
		}

		// Defining Subnets
		subnet1, err := ec2.NewSubnet(ctx, "memescopeSubnet1", &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.1.0/24"),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			AvailabilityZone:    pulumi.String("us-east-1a"),
		})
		if err != nil {
			return err
		}

		subnet2, err := ec2.NewSubnet(ctx, "memescopeSubnet2", &ec2.SubnetArgs{
			VpcId:               vpc.ID(),
			CidrBlock:           pulumi.String("10.0.2.0/24"),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			AvailabilityZone:    pulumi.String("us-east-1b"),
		})
		if err != nil {
			return err
		}

		// Defining Security Group
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

		// Route Table Setup
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

		// Removing AWS Fargate
		// 🚨 No ECS Cluster
		// 🚨 No ECS Task Definition
		// 🚨 No ECS Service (Fargate)

		// Setting Up DynamoDB Table
		solanaTransactionsTable, err := dynamodb.NewTable(ctx, "solanaTransactions", &dynamodb.TableArgs{
			Attributes: dynamodb.TableAttributeArray{
				&dynamodb.TableAttributeArgs{
					Name: pulumi.String("signature"),
					Type: pulumi.String("S"),
				},
				&dynamodb.TableAttributeArgs{
					Name: pulumi.String("timestamp"),
					Type: pulumi.String("N"),
				},
			},
			HashKey:     pulumi.String("signature"),
			RangeKey:    pulumi.String("timestamp"),
			BillingMode: pulumi.String("PAY_PER_REQUEST"),
		})
		if err != nil {
			return err
		}

		// Creating SNS Topic
		tradeUpdatesTopic, err := sns.NewTopic(ctx, "TradeUpdatesTopic", &sns.TopicArgs{
			Name: pulumi.String("TradeUpdatesTopic"),
		})
		if err != nil {
			return err
		}

		// Setting Up CloudWatch Logs
		logGroup, err := cloudwatch.NewLogGroup(ctx, "memescopeLogGroup", &cloudwatch.LogGroupArgs{
			RetentionInDays: pulumi.Int(14),
		})
		if err != nil {
			return err
		}

		// Exporting Outputs
		ctx.Export("Solanatable", solanaTransactionsTable.Name)
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("subnet1Id", subnet1.ID())
		ctx.Export("subnet2Id", subnet2.ID())
		ctx.Export("securityGroupId", securityGroup.ID())
		ctx.Export("dynamoDbTableName", solanaTransactionsTable.Name)
		ctx.Export("snsTopicArn", tradeUpdatesTopic.Arn)
		ctx.Export("awsRegion", pulumi.String("us-east-1"))
		ctx.Export("cloudWatchLogGroup", logGroup.Name)

		return nil
	})
}
