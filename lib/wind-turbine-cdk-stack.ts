import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';

export class WindTurbineCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create SiteWise Asset Model for Wind Turbine
    const windTurbineModel = new cdk.aws_iotsitewise.CfnAssetModel(this, 'WindTurbineModel', {
      assetModelName: 'WindTurbine',
      assetModelProperties: [
        {
          name: 'Make',
          dataType: 'STRING',
          externalId: 'make',
          type: {
            typeName: 'Attribute'
          }
        },
        {
          name: 'Location',
          dataType: 'STRING',
          externalId: 'location',
          type: {
            typeName: 'Attribute'
          }
        },
        {
          name: 'Torque_KiloNewton_Meter',
          dataType: 'DOUBLE',
          externalId: 'torque',
          type: {
            typeName: 'Measurement'
          }
        },
        {
          name: 'Wind_Direction',
          dataType: 'DOUBLE',
          externalId: 'wind_direction',
          type: {
            typeName: 'Measurement'
          }
        },
        {
          name: 'RotationsPerMinute',
          dataType: 'DOUBLE',
          externalId: 'rpm',
          type: {
            typeName: 'Measurement'
          }
        },
        {
          name: 'Wind_Speed',
          dataType: 'DOUBLE',
          externalId: 'wind_speed',
          type: {
            typeName: 'Measurement'
          }
        }
      ]
    });

    // Create 4 Wind Turbine Assets
    const turbines = ['Turbine-001', 'Turbine-002', 'Turbine-003', 'Turbine-004'];
    const assets: cdk.aws_iotsitewise.CfnAsset[] = [];

    turbines.forEach((name, index) => {
      const asset = new cdk.aws_iotsitewise.CfnAsset(this, name, {
        assetName: name,
        assetModelId: windTurbineModel.attrAssetModelId,
        assetHierarchies: [],
        assetProperties: [
          {
            alias: `/${name}/make`,
            externalId: 'make'
          },
          {
            alias: `/${name}/location`,
            externalId: 'location'
          },
          {
            alias: `/${name}/torque`,
            externalId: 'torque'
          },
          {
            alias: `/${name}/wind_direction`,
            externalId: 'wind_direction'
          },
          {
            alias: `/${name}/rpm`,
            externalId: 'rpm'
          },
          {
            alias: `/${name}/wind_speed`,
            externalId: 'wind_speed'
          }
        ]
      });
      assets.push(asset);
    });

    // Lambda function to send measurements
    const measurementSender = new lambda.Function(this, 'MeasurementSender', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'measurement-sender.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        ASSET_MODEL_ID: windTurbineModel.attrAssetModelId,
        TURBINE_NAMES: JSON.stringify(assets.map(asset => asset.assetName))
      }
    });

    // Grant SiteWise permissions to Lambda
    measurementSender.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iotsitewise:BatchPutAssetPropertyValue'],
      resources: ['*']
    }));

    // EventBridge rule to trigger every minute
    new events.Rule(this, 'MeasurementSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
      targets: [new targets.LambdaFunction(measurementSender)]
    });

    // Query Lambda function
    const queryExecutor = new lambda.Function(this, 'QueryExecutor', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'query-executor.handler',
      timeout: cdk.Duration.seconds(30),
      code: lambda.Code.fromAsset('lambda')
    });

    // Grant SiteWise query permissions to Lambda
    queryExecutor.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iotsitewise:ExecuteQuery'],
      resources: ['*']
    }));
  }
}
