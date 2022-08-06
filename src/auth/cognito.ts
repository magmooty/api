export interface CognitoConfig {
  cognitoUserPoolId: string;
  cognitoClientId: string;
  region: string;
  tokenUse: string;
  tokenExpiration: number;
}

export class CognitoAuthDriver {}
