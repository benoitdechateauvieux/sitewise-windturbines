import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

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
    
    turbines.forEach((name, index) => {
      new cdk.aws_iotsitewise.CfnAsset(this, name, {
        assetName: name,
        assetModelId: windTurbineModel.attrAssetModelId
      });
    });
  }
}
