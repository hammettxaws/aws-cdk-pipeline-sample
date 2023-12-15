import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as pipelines from 'aws-cdk-lib/pipelines';


class ApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // application bucket
    const appBucket = new s3.Bucket(this, 'appBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });
  }
}

class AppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new ApplicationStack(this, 'AppStack');
  }
}

export class CdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // environment variables
    const account1 = process.env.ACCT_1 || ''
    const account2 = process.env.ACCT_2 || ''
    const region1 = process.env.REGN_1 || ''
    const region2 = process.env.REGN_2 || ''

    const repo = codecommit.Repository.fromRepositoryName(this, 'Repository', 'learn30')

    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      crossAccountKeys: true,
      pipelineName: 'ApplicationPipeline',
      synth: new pipelines.CodeBuildStep('SynthStep', {
        input: pipelines.CodePipelineSource.codeCommit(repo, 'main'),
        installCommands: [
          'npm install -g aws-cdk'
        ],
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth'
        ],
        env: {
          ACCT_1: account1,
          ACCT_2: account2,
          REGN_1: region1,
          REGN_2: region2,
        }
      }),
    });

    // deploy in stages
    pipeline.addStage(new AppStage(this, 'DEV', {
      env: { account: account1, region: region1 }
    }));

    // deploy in stages
    pipeline.addStage(new AppStage(this, 'STG', {
      env: { account: account1, region: region2 }
    }));

    // deploy in waves
    const prodWave = pipeline.addWave('PROD');
    prodWave.addStage(new AppStage(this, 'prod', {
      env: { account: account2, region: region1 }
    }));
    prodWave.addStage(new AppStage(this, 'dr', {
      env: { account: account2, region: region2 }
    }));  
  }
}

