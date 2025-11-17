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
    const measurementLambda = new lambda.Function(this, 'MeasurementLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import boto3
import json
import random
import time
import os

def handler(event, context):
    client = boto3.client('iotsitewise')
    
    asset_names = [
        os.environ['TURBINE_001_NAME'],
        os.environ['TURBINE_002_NAME'],
        os.environ['TURBINE_003_NAME'],
        os.environ['TURBINE_004_NAME']
    ]
    
    
    for asset_name in asset_names:
        entries = []
        timestamp = int(time.time())

        entries.append({
            'entryId': f'{asset_name}-make-{timestamp}',
            'propertyAlias': f'/{asset_name}/make',
            'propertyValues': [{
                'value': {'stringValue': 'Amazon'},
                'timestamp': {'timeInSeconds': timestamp}
            }]
        })
        entries.append({
            'entryId': f'{asset_name}-location-{timestamp}',
            'propertyAlias': f'/{asset_name}/location',
            'propertyValues': [{
                'value': {'stringValue': 'Renton'},
                'timestamp': {'timeInSeconds': timestamp}
            }]
        })
        entries.append({
            'entryId': f'{asset_name}-torque-{timestamp}',
            'propertyAlias': f'/{asset_name}/torque',
            'propertyValues': [{
                'value': {'doubleValue': random.uniform(100, 500)},
                'timestamp': {'timeInSeconds': timestamp}
            }]
        })
        entries.append({
            'entryId': f'{asset_name}-wind_direction-{timestamp}',
            'propertyAlias': f'/{asset_name}/wind_direction',
            'propertyValues': [{
                'value': {'doubleValue': random.uniform(0, 360)},
                'timestamp': {'timeInSeconds': timestamp}
            }]
        })
        entries.append({
            'entryId': f'{asset_name}-rpm-{timestamp}',
            'propertyAlias': f'/{asset_name}/rpm',
            'propertyValues': [{
                'value': {'doubleValue': random.uniform(10, 50)},
                'timestamp': {'timeInSeconds': timestamp}
            }]
        })
        entries.append({
            'entryId': f'{asset_name}-wind_speed-{timestamp}',
            'propertyAlias': f'/{asset_name}/wind_speed',
            'propertyValues': [{
                'value': {'doubleValue': random.uniform(5, 25)},
                'timestamp': {'timeInSeconds': timestamp}
            }]
        })
            
        response = client.batch_put_asset_property_value(entries=entries)
        print(f"Successfully sent {len(entries)} measurements")
        print(f"Response: {response}")
      `),
      environment: {
        ASSET_MODEL_ID: windTurbineModel.attrAssetModelId,
        TURBINE_001_NAME: assets[0].assetName,
        TURBINE_002_NAME: assets[1].assetName,
        TURBINE_003_NAME: assets[2].assetName,
        TURBINE_004_NAME: assets[3].assetName
      }
    });

    // Grant SiteWise permissions to Lambda
    measurementLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iotsitewise:BatchPutAssetPropertyValue'],
      resources: ['*']
    }));

    // EventBridge rule to trigger every minute
    new events.Rule(this, 'MeasurementSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
      targets: [new targets.LambdaFunction(measurementLambda)]
    });

    // Query Lambda function
    const queryLambda = new lambda.Function(this, 'QueryLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(30),
      code: lambda.Code.fromInline(`
import boto3
import json

def handler(event, context):
    sitewise = boto3.client('iotsitewise')
    
    make = event.get('make', 'Amazon')
    location = event.get('location', 'Renton')
    rpm_threshold = event.get('rpm_threshold', 25)
    torque_threshold = event.get('torque_threshold', 300)
    wind_speed_threshold = event.get('wind_speed_threshold', 15)
    wind_direction_threshold = event.get('wind_direction_threshold', 100)
    
    query = f'''
    SELECT
      asset_id,
      asset_name
    FROM
      asset
    WHERE asset_id IN (
        SELECT asset_id
        FROM latest_value_time_series
        WHERE SUBSTR(property_alias, '[^/]+$') = 'location'
        AND string_value = '{location}'
    )
    AND asset_id IN (
        SELECT asset_id
        FROM latest_value_time_series
        WHERE SUBSTR(property_alias, '[^/]+$') = 'make'
        AND string_value = '{make}'
    )
    AND (
        asset_id IN (
            SELECT asset_id
            FROM latest_value_time_series
            WHERE SUBSTR(property_alias, '[^/]+$') = 'rpm'
            AND double_value > {rpm_threshold}
        )
        OR asset_id IN (
            SELECT asset_id
            FROM latest_value_time_series
            WHERE SUBSTR(property_alias, '[^/]+$') = 'torque'
            AND double_value > {torque_threshold}
        )
        OR (
            asset_id IN (
                SELECT asset_id
                FROM latest_value_time_series
                WHERE SUBSTR(property_alias, '[^/]+$') = 'wind_speed'
                AND double_value > {wind_speed_threshold}
            )
            AND asset_id IN (
                SELECT asset_id
                FROM latest_value_time_series
                WHERE SUBSTR(property_alias, '[^/]+$') = 'wind_direction'
                AND double_value > {wind_direction_threshold}
            )
        )
    )
    ORDER BY asset_name
    '''
    
    response = sitewise.execute_query(queryStatement=query)
    return {'statusCode': 200, 'body': json.dumps(response)}
      `)
    });

    // Grant SiteWise query permissions to Lambda
    queryLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iotsitewise:ExecuteQuery'],
      resources: ['*']
    }));
  }
}
