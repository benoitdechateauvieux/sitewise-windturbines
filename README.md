# Amazon SiteWise - Wind Turbines demo

This CDK stack deploys
- an Amazon SiteWise model: `WindTurbine`
- four wind turbine assets
- a `Measurement Sender` lambda that put measurements every 1 minute
- a `Query Executor` lambda that uses the [ExecuteQuery API](https://docs.aws.amazon.com/iot-sitewise/latest/userguide/sql.html) to get the list of assets that match criterias

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

## Query Executor Input
```json
{
  "make": "Amazon",
  "location": "Renton",
  "rpm_threshold": 25,
  "torque_threshold": 300,
  "wind_speed_threshold": 15,
  "wind_direction_threshold": 100
}
```