#!/usr/bin/env node
import 'source-map-support/register';
import 'dotenv/config'
import * as cdk from 'aws-cdk-lib';
import { CdkAppStack } from '../lib/cdk-app-stack';

const account = process.env.ACCT_1
const region = process.env.REGN_1

const app = new cdk.App();
new CdkAppStack(app, 'CdkAppStack', {
  env: { account: account, region: region },
});