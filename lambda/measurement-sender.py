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
