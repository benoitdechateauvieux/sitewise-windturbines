import boto3
import json
import random
import time
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    try:
        client = boto3.client('iotsitewise')
        
        asset_names = json.loads(os.environ['TURBINE_NAMES'])
        
        
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
            logger.info(f"Successfully sent {len(entries)} measurements for {asset_name}")
    
    except Exception as e:
        logger.error(f"Error sending measurements: {str(e)}")
        raise
