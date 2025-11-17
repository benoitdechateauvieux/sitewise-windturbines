import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    try:
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
        
        logger.info(f"Executing query with parameters: make={make}, location={location}")
        response = sitewise.execute_query(queryStatement=query)
        return {'statusCode': 200, 'body': json.dumps(response)}
    
    except Exception as e:
        logger.error(f"Error executing query: {str(e)}")
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
