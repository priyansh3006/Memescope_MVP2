package main

import (
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// ✅ 1. Create a VPC
		vpc, err := ec2.NewVpc(ctx, "memescopeVpc", &ec2.VpcArgs{
			CidrBlock:          pulumi.String("10.0.0.0/16"),
			EnableDnsSupport:   pulumi.Bool(true),
			EnableDnsHostnames: pulumi.Bool(true),
		})
		if err != nil {
			return err
		}

		// ✅ 2. Create Two Public Subnets in Different Availability Zones
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

		// ✅ 3. Internet Gateway & Route Table
		igw, err := ec2.NewInternetGateway(ctx, "memescopeIgw", &ec2.InternetGatewayArgs{
			VpcId: vpc.ID(),
		})
		if err != nil {
			return err
		}

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

		// Associate Route Table with Subnets
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

		// ✅ 4. Security Group for API and Database
		securityGroup, err := ec2.NewSecurityGroup(ctx, "memescopeSG", &ec2.SecurityGroupArgs{
			VpcId: vpc.ID(),
			Ingress: ec2.SecurityGroupIngressArray{
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(4000), // API Port
					ToPort:     pulumi.Int(4000),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
				&ec2.SecurityGroupIngressArgs{
					Protocol:   pulumi.String("tcp"),
					FromPort:   pulumi.Int(5432), // PostgreSQL Port
					ToPort:     pulumi.Int(5432),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
			Egress: ec2.SecurityGroupEgressArray{
				&ec2.SecurityGroupEgressArgs{
					Protocol:   pulumi.String("-1"),
					FromPort:   pulumi.Int(0),
					ToPort:     pulumi.Int(0),
					CidrBlocks: pulumi.StringArray{pulumi.String("0.0.0.0/0")},
				},
			},
		})
		if err != nil {
			return err
		}

		// ✅ 5. RDS PostgreSQL Database
		dbSubnetGroup, err := rds.NewSubnetGroup(ctx, "memescope-db-subnetgroup", &rds.SubnetGroupArgs{
			SubnetIds: pulumi.StringArray{subnet1.ID(), subnet2.ID()},
		})
		if err != nil {
			return err
		}

		db, err := rds.NewInstance(ctx, "memescope-db", &rds.InstanceArgs{
			Engine:              pulumi.String("postgres"),
			InstanceClass:       pulumi.String("db.t3.micro"),
			AllocatedStorage:    pulumi.Int(20),
			DbName:              pulumi.String("memescope"),
			Username:            pulumi.String("memescope_user"),
			Password:            pulumi.String("securepassword123"),
			SkipFinalSnapshot:   pulumi.Bool(true),
			DbSubnetGroupName:   dbSubnetGroup.Name,
			VpcSecurityGroupIds: pulumi.StringArray{securityGroup.ID()},
			PubliclyAccessible:  pulumi.Bool(false),
		})
		if err != nil {
			return err
		}

		// ✅ 6. CloudWatch Log Group
		_, err = cloudwatch.NewLogGroup(ctx, "memescopeLogGroup", &cloudwatch.LogGroupArgs{
			RetentionInDays: pulumi.Int(14),
		})
		if err != nil {
			return err
		}

		// ✅ Export Outputs
		ctx.Export("vpcId", vpc.ID())
		ctx.Export("dbEndpoint", db.Endpoint)
		ctx.Export("securityGroupId", securityGroup.ID())

		return nil
	})
}
