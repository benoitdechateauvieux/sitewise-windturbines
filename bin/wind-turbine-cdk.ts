#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { WindTurbineCdkStack } from '../lib/wind-turbine-cdk-stack';

const app = new cdk.App();
new WindTurbineCdkStack(app, 'WindTurbineCdkStack');