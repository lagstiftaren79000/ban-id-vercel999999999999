import * as https from "https";

import type { AxiosInstance } from "axios";
import axios from "axios";
import { QrGenerator, QrGeneratorOptions } from "./qrgenerator";

//
// Embedded CA certificates (base64) — no filesystem access needed
//
const EMBEDDED_TEST_CA_B64 = "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tIApNSUlGMERDQ0E3aWdBd0lCQWdJSUloWWF4dTRraGdBd0RRWUpLb1pJaHZjTkFRRU5CUUF3YkRFa01DSUdBMVVFIENnd2JSbWx1WVc1emFXVnNiQ0JKUkMxVVpXdHVhV3NnUWtsRUlFRkNNUm93R0FZRFZRUUxEQkZKYm1aeVlYTjAgY25WamRIVnlaU0JEUVRFb01DWUdBMVVFQXd3ZlZHVnpkQ0JDWVc1clNVUWdVMU5NSUZKdmIzUWdRMEVnZGpFZyBWR1Z6ZERBZUZ3MHhOREV4TWpFeE1qTTVNekZhRncwek5ERXlNekV4TWpNNU16RmFNR3d4SkRBaUJnTlZCQW9NIEcwWnBibUZ1YzJsbGJHd2dTVVF0VkdWcmJtbHJJRUpKUkNCQlFqRWFNQmdHQTFVRUN3d1JTVzVtY21GemRISjEgWTNSMWNtVWdRMEV4S0RBbUJnTlZCQU1NSDFSbGMzUWdRbUZ1YTBsRUlGTlRUQ0JTYjI5MElFTkJJSFl4SUZSbCBjM1F3Z2dJaU1BMEdDU3FHU0liM0RRRUJBUVVBQTRJQ0R3QXdnZ0lLQW9JQ0FRQ0FLV3NKYy9rVi8wNDM0ZCtTIHFuMTltSXI4NVJaL1BnUkZhVXBsU3JuaHV6QW1hWGloUExDRXNkM01oL1lFcnlnY3hoUS9NQXppNU9aL2FuZnUgV1NDd2NlUmxRSU50dmxSUGRNb2VadHUyOUZzbnRLMVo1cjJTWU5kRndiUkZiOFdOOUZzVTBLdkM1elZudURNZyBzNWRVWndUbWR6WDVaZExQN3BkZ0IzemhUbnJhNU9SdGtpV2lVeEpWZXY5a2VSZ0FvMDBaSElSSit4VGZpU1BkIEpjMzE0bWFpZ1ZSUVpkR0tTeVFjUU1UV2kxWUx3ZDJ6d09hY054bGVZZjh4cUtna1pzbWtyYzREcDJtUjVQa3Igbm5LQjZBN3NBT1NOYXR1YTdNODZFZ2NHaTlBYUV5YVJNa1lKSW1iQmZ6YU5sYUJQeU1TdndtQlp6cDJ4S2M5TyBEM1UwNm9nVjZDSmpKTDdoU3VWYzV4LzJIMDRkKzJJK0RLd2VwNllCb1ZMOUw4MWdSWVJ5Y3FnK3crY1RaMVRGIC9zNk5DNVlSS1NlT0NyTHczb21iaGp5eXVQbDhUL2g5Y3BYdDZtM3kyeElWTFlWemVEaGFxbDNoZGk2SXBSaDYgcndrTWhKL1htT3BiRGluWGIxZldkRk95UXdxc1hRV09Fd0tCWUlrTTZjUG51aWQ3cXdheGZQMjJoRGdBb2xHTSBMWTdUUEtVUFJ3VithNVkzVlBsN2gwWVNLN2xEeWNrVEpkdEJxSTZkNFBXUUxuSGFrVWdSUXk2OW5aaEdSdFV0IFBNU0o3STRRdHQzQjZBd0RxK1NKVGdnd3RKUUhlaWQwalBraTZwb3VlbmhQUTZkWlQ1MzJ4MTZYRCtXSWNEMmYgLy9YenpPdWVTMjlLQjdsdC93SDVLNkV1eHdJREFRQUJvM1l3ZERBZEJnTlZIUTRFRmdRVURZNlhKL0ZJUkZYMyBkQjRXZXAzUlZNODRSWG93RHdZRFZSMFRBUUgvQkFVd0F3RUIvekFmQmdOVkhTTUVHREFXZ0JRTmpwY244VWhFIFZmZDBIaFo2bmRGVXp6aEZlakFSQmdOVkhTQUVDakFJTUFZR0JDb0RCQVV3RGdZRFZSMFBBUUgvQkFRREFnRUcgTUEwR0NTcUdTSWIzRFFFQkRRVUFBNElDQVFBNXM1OS9PbGlvNHN2SFhpS3U3c1BRUnZyZjRHZkdCN2hVakJHayBZVzJZT0hUWW5IYXZTcWxCQVNIYzhnR0d3dWM3djcrSCt2bU9mU0xaZkdEcXhuQnFlSngxSDVFMFlxRVh0TnFXIEcxSnVzSUZhOXhXeXBjT05qZzl2N0lNbnh4UXpMWXdzNFl3Z1B5Y2hwTXpXWTZCNWhac2pVeUtnQisxaWd4bmYgdWFCdWVMUHczWmFKaGNDTDhnejZTZENLbVFwWDRWYUFhZFMwdmRNckJPbWQ4MjZIK2FER1plazF2TWp1SDExRiBmSm9YWTJqeURubG9sN1o0QmZIYzAxMXRvV05NeG9qSTd3K1U0S0tDYlN4cFdGVllJVFo4V2xZSGNqK2IyQTErIGRGUVpGelFOK1kxV3gzVklVcVNrczZQN0Y1YUYvbDRSQm5neTA4emtQN2lMQS9DN3JtNjF4V3hUbXBqM3A2U0cgZlVCc3JzQnZCZ2ZKUUhEL014OFUzaVFDYTBWajFYUG9nRS9QWFFRcTJ2eVdpQVA2NjJoRDZvZzEvb20zbDFQSiBUQlV5WVh4cUpPNzV1eDhJV2JsVXdBanNtVGxGL1BjajhRYmNNUFhMTVRnTlFBZ2FyVjZndWNoaml2WXFiNlpyIGhxK05oM0pyRjBIWVF1TWdFeFE2Vlg4VDU2c2FPRXRtbHA2TFNRaTRIdkthdENOZldVSkdvWWVUNVNyY0o2c24gQnk3WExNaFFVQ09YY0J3S2JOdlg2YVA3OVZBM3llSkhaTzdYUGFyWDdWOUJCK2p0ZjR0ei91c21BVC8rcVh0SCBDQ3Y5WGY0bHY4amdkT25GZlhiWHVUOEk0Z3o4dXE4RWxCbHBiSm50TzZwL05ZNWEwOEU2QzdGV1ZSK1dKNXZaT1AySHNBPT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQ==";
const EMBEDDED_PROD_CA_B64 = "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUZ2akNDQTZhZ0F3SUJBZ0lJVHlUaC91MWJFeG93RFFZSktvWklodmNOQVFFTkJRQXdZakVrTUNJR0ExVUVDZ3diUm1sdVlXNXphV1ZzYkNCSlJDMVVaV3R1YVdzZ1FrbEVJRUZDTVJvd0dBWURWUVFMREJGSmJtWnlZWE4wY25WamRIVnlaU0JEUVRFZU1Cd0dBMVVFQXd3VlFtRnVhMGxFSUZOVFRDQlNiMjkwSUVOQklIWXhNQjRYRFRFeE1USXdOekV5TXpRd04xb1hEVE0wTVRJek1URXlNelF3TjFvd1lqRWtNQ0lHQTFVRUNnd2JSbWx1WVc1emFXVnNiQ0JKUkMxVVpXdHVhV3NnUWtsRUlFRkNNUm93R0FZRFZRUUxEQkZKYm1aeVlYTjBjblZqZEhWeVpTQkRRVEVlTUJ3R0ExVUVBd3dWUW1GdWEwbEVJRk5UVENCU2IyOTBJRU5CSUhZeE1JSUNJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBZzhBTUlJQ0NnS0NBZ0VBd1ZBNHNuWmlTRkkzcjY0THZZdTRtT3NJNDJBOWFMS0VRR3E0SVpvMjU3aXF2UEg4MlNNdmdCSmdFNTJrQ3g3Z1FNbVo3aVNtMzlDRUExOWhsSUxoOEpFSk5UeUpOeE14VkRONmNmSlAxak1ISmVURVMxVG1WYldVcUd5THB5VDhMQ0poQzlWcTRXM3QvTzFzdkdKTk9VUUlRTDRlQUhTdldUVm9hbHh6b21KaE9uOTdFTmpYQXQ0QkxiNnNIZlZCdm1CNVJlSzBVZndwTkFDRk0xUk44YnRFYURkV0M0UGZBNzJ5elYzd0svY1k1aDJrMVJNMXMxOVBqb3hucEpxcm1uNHFabVA0dE4vbmsyZDdjNEZFckpBUDBwbk5zbGwxK0pma2RNZmlQRDM1K3FjY2xwc3B6UDJMcGF1UVZ5UGJPMjFOaCtFUHRyNytJaWMydGtnejBnMWtLMElML2ZvRnJKMElldnlyM0RybTJ1Um5BMGVzWjQ1R09tWmhFMjJteWNFWDlsN3c5anJkc0t0cXM3Ti9UNDZoaWw0eEJpR2JsWGtxS05HNlR2QVJrNlhxT3AzUnRVdkdHYUtabkdsbHNnVHZQMzgvbnJTTWxzek5vanJsYkRubTE2R0dvUlRRbndyOGwrWXZiei9ldi9lNndWRkRqYjUyWkIwWi9LVGZqWE9sNWNBSjdPQ2JPRE1XZjhOYTU2T1RsSWtyazVOeVUvdUd6SkZVUVN2R2RMSFVpcEovc1RaQ2JxTlNaVXdib0kwb1FOTy9ZZ2V6Mko2emdXWEdwRFdpTjRMR0xEbUJoQjNUOENNUXU5Si9CY0Z2Z2puVXloeWltMzVrRHBqVlBDOG5yU2lyNU9rYVlnR2RZV2REdXYxNDU2bEZOUE5OUWNkWmR0NWZjbU1DQXdFQUFhTjRNSFl3SFFZRFZSME9CQllFRlBncXN1eDVSdGNySWhBVmV1TEJTZ0J1UkRGVk1BOEdBMVVkRXdFQi93UUZNQU1CQWY4d0h3WURWUjBqQkJnd0ZvQVUrQ3F5N0hsRzF5c2lFQlY2NHNGS0FHNUVNVlV3RXdZRFZSMGdCQXd3Q2pBSUJnWXFoWEJPQVFRd0RnWURWUjBQQVFIL0JBUURBZ0VHTUEwR0NTcUdTSWIzRFFFQkRRVUFBNElDQVFBSk9qVU9TMkdKUE5ycnJxZjUzOWFOMS9FYlVqNVpWUmpHNHd6VnRYNXlWcVBHY1JaalVRbE5UY2ZPcHdQb2N6S0JuTlgyT01GK1FtOTRiYit4WGMvMDhBRVJxSkozRlBLdThvRE5lSytSdjFYNG5oOTVKNFJIWmN2bDRBR2hFQ21HTXloeUNlYTBxWkJGQnNCcVFSN29DOWFmWU94c1NvdmFQcVgzMVFNTFVMV1VZb0JLV1dITFZWSW9IakFtR3RBek1rTHdlMC9sclZ5QXByOWl5WFdoVnIrcVlHbUZHdzErcndtdkRtbVNMV05XYXdZZ0g0Tll4VGY4ejVoQmlET2RBZ2lsdnlpQUY4WWwwa0NLVUIyZkFQaFJOWWxFY04rVVAvS0wyNGgvcEIraFo5bXZSMHRNNm5XM0hWWmFEcnZSejRWaWhaOHZSaTNmWW5PQWtORTZrWmRycmRPN0xkQmM5eVlrZlFkVGN5ME4rQXc3cTRUa1E4bnBvbXJWbVRLYVBodEdoQTdWSUN5Uk5CVmN2eW94citDWTdhUlF5SG4vQzduL2pSc1FZeHM3dWMrbXNxNmpSUzRIUEs4b2xuRjl1c1daWDZLWSs4bXdlSmlURTR1TjRaVVVCVXR0OFdjWFhEaUsvYnhFRzJhbWpQY1ovYjRMWHdHQ0piK2FOV1A0K2lZNmtCS3JNQU5zMDFwTHZ0VmpVUzlSdFJyWTNjTkVPaG1LaE8wcUpTRFhoc1RjVnRwYkRyMzdVVFNxUVZ3ODNkUmVpQVJQd0dkVVJtbWthaGVINno0azZxRVVTWHVGY2gwdzUzVUFjKzFhQlhSMWJneUZxTWR5N1l4aWIyQVl1N3duckhpb0RXcVA2RFRrVVNVZU1CL3pxV1BNL3F4NlFOTk9jYU9jakE9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0t";
const EMBEDDED_TEST_PFX_B64 = "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";

function b64ToBuffer(b64: string): Buffer {
  return Buffer.from(b64, "base64");
}


//
// Type definitions for /auth
//

export interface AuthRequestV5 {
  endUserIp: string;
  personalNumber?: string;
  requirement?: AuthOptionalRequirements;
  userVisibleData?: string;
  userVisibleDataFormat?: "simpleMarkdownV1";
  userNonVisibleData?: string;
}

export interface AuthResponse {
  /**
   * Use in deeplink to start BankId on same device.
   * @example `bankid:///?autostarttoken=[TOKEN]&redirect=[RETURNURL]`
   */
  autoStartToken: string;
  qrStartSecret: string;
  qrStartToken: string;
  orderRef: string;
}

interface AuthOptionalRequirements {
  cardReader?: "class1" | "class2";
  certificatePolicies?: string[];
  issuerCn?: string[];
  autoStartTokenRequired?: boolean;
  allowFingerprint?: boolean;
}

//
// Type definitions for /sign
//

export interface SignRequest extends AuthRequestV5 {
  userVisibleData: string;
}

export interface SignResponse extends AuthResponse {}

//
// Type definitions for /collect
//

export interface CollectRequest {
  orderRef: string;
}

type CollectResponse = CollectResponseV5 | CollectResponseV6;
export interface CollectResponseV5 {
  orderRef: string;
  status: "pending" | "failed" | "complete";
  hintCode?: FailedHintCode | PendingHintCode;
  completionData?: CompletionData;
}

export interface CompletionData {
  user: {
    personalNumber: string;
    name: string;
    givenName: string;
    surname: string;
  };
  device: {
    ipAddress: string;
  };
  cert: {
    notBefore: string;
    notAfter: string;
  };
  signature: string;
  ocspResponse: string;
}

export type FailedHintCode =
  | "expiredTransaction"
  | "certificateErr"
  | "userCancel"
  | "cancelled"
  | "startFailed";

export type PendingHintCode =
  | "outstandingTransaction"
  | "noClient"
  | "started"
  | "userSign";

//
// Type definitions for /cancel
//

export interface CancelRequest extends CollectRequest {}

export interface CancelResponse {}

//
// Type definitions for error responses
//

export interface ErrorResponse {
  errorCode: BankIdErrorCode;
  details: string;
}

export enum BankIdErrorCode {
  ALREADY_IN_PROGRESS = "alreadyInProgress",
  INVALID_PARAMETERS = "invalidParameters",
  UNAUTHORIZED = "unauthorized",
  NOT_FOUND = "notFound",
  METHOD_NOT_ALLOWED = "methodNotAllowed",
  REQUEST_TIMEOUT = "requestTimeout",
  UNSUPPORTED_MEDIA_TYPE = "unsupportedMediaType",
  INTERNAL_ERROR = "internalError",
  MAINTENANCE = "maintenance",
}

export const REQUEST_FAILED_ERROR = "BANKID_NO_RESPONSE";

//
// Collection of overarching types
//

export enum BankIdMethod {
  auth = "auth",
  sign = "sign",
  collect = "collect",
  cancel = "cancel",
}

export type BankIdRequest =
  | AuthRequestV5
  | SignRequest
  | CollectRequest
  | CancelRequest;

export type BankIdResponse =
  | CancelResponse
  | AuthResponse
  | SignResponse
  | CollectResponseV5
  | CollectResponseV6;

//
// Client settings
//

interface BankIdClientSettings {
  production: boolean;
  refreshInterval?: number;
  /**
   * PFX certificate as a Buffer or base64 string.
   * For Vercel: store your cert as a base64 env var and pass
   * `Buffer.from(process.env.BANKID_PFX_BASE64!, "base64")` here.
   */
  pfx?: string | Buffer;
  passphrase?: string;
  /**
   * CA certificate as a Buffer, string PEM content, or base64 string.
   * Defaults to the embedded BankID CA for the chosen environment.
   */
  ca?: string | Buffer;
}

//
// Error types
//

export class BankIdError extends Error {
  readonly code: BankIdErrorCode;
  readonly details?: string;

  constructor(code: BankIdErrorCode, details?: string) {
    super(code);
    Error.captureStackTrace(this, this.constructor);

    this.name = "BankIdError";
    this.code = code;
    this.details = details;
  }
}

export class RequestError extends Error {
  readonly request?: any;

  constructor(request?: any) {
    super(REQUEST_FAILED_ERROR);
    Error.captureStackTrace(this, this.constructor);

    this.name = "RequestError";
    this.request = request;
  }
}

//
// Client implementation
//

export class BankIdClient {
  readonly options: Required<BankIdClientSettings>;
  axios: AxiosInstance;

  version = "v5.1";

  constructor(options?: BankIdClientSettings) {
    this.options = {
      production: false,
      refreshInterval: 2000,
      ...options,
    } as Required<BankIdClientSettings>;

    if (this.options.production) {
      if (!options?.pfx || !options?.passphrase) {
        throw new Error(
          "BankId requires the pfx and passphrase in production mode",
        );
      }
    } else {
      // In test mode, fall back to the embedded test certificate
      if (this.options.pfx === undefined) {
        this.options.pfx = b64ToBuffer(EMBEDDED_TEST_PFX_B64);
      }
      if (this.options.passphrase === undefined) {
        this.options.passphrase = "qwerty123";
      }
    }

    // Use embedded CA certs by default — no filesystem access required
    if (this.options.ca === undefined) {
      this.options.ca = this.options.production
        ? b64ToBuffer(EMBEDDED_PROD_CA_B64)
        : b64ToBuffer(EMBEDDED_TEST_CA_B64);
    }

    this.axios = this.createAxiosInstance();
    return this;
  }

  /**
   * Create a BankIdClient from environment variables.
   * Expects:
   *   BANKID_PFX_BASE64   — base64-encoded .p12 certificate
   *   BANKID_PASSPHRASE   — certificate passphrase
   *   BANKID_PRODUCTION   — "true" for production, anything else for test
   *
   * Example Vercel usage:
   *   const client = BankIdClient.fromEnv();
   */
  static fromEnv(options?: Omit<BankIdClientSettings, "pfx" | "passphrase" | "production">): BankIdClient {
    const production = process.env.BANKID_PRODUCTION === "true";
    const pfxB64 = process.env.BANKID_PFX_BASE64;
    const passphrase = process.env.BANKID_PASSPHRASE;

    if (production && (!pfxB64 || !passphrase)) {
      throw new Error(
        "Missing required env vars: BANKID_PFX_BASE64 and BANKID_PASSPHRASE must be set in production mode.",
      );
    }

    return new BankIdClient({
      ...options,
      production,
      pfx: pfxB64 ? Buffer.from(pfxB64, "base64") : undefined,
      passphrase: passphrase ?? undefined,
    });
  }

  authenticate(parameters: AuthRequestV5): Promise<AuthResponse> {
    if (!parameters.endUserIp) {
      throw new Error("Missing required argument endUserIp.");
    }
    if (
      parameters.userVisibleDataFormat != null &&
      parameters.userVisibleDataFormat !== "simpleMarkdownV1"
    ) {
      throw new Error("userVisibleDataFormat can only be simpleMarkdownV1.");
    }

    parameters = {
      ...parameters,
      userVisibleData: parameters.userVisibleData
        ? Buffer.from(parameters.userVisibleData).toString("base64")
        : undefined,
      userNonVisibleData: parameters.userNonVisibleData
        ? Buffer.from(parameters.userNonVisibleData).toString("base64")
        : undefined,
    };

    return this.#call<AuthRequestV5, AuthResponse>(
      BankIdMethod.auth,
      parameters,
    );
  }

  sign(parameters: SignRequest): Promise<SignResponse> {
    if (!parameters.endUserIp || !parameters.userVisibleData) {
      throw new Error(
        "Missing required arguments: endUserIp, userVisibleData.",
      );
    }
    if (
      parameters.userVisibleDataFormat != null &&
      parameters.userVisibleDataFormat !== "simpleMarkdownV1"
    ) {
      throw new Error("userVisibleDataFormat can only be simpleMarkdownV1.");
    }

    parameters = {
      ...parameters,
      userVisibleData: Buffer.from(parameters.userVisibleData).toString(
        "base64",
      ),
      userNonVisibleData: parameters.userNonVisibleData
        ? Buffer.from(parameters.userNonVisibleData).toString("base64")
        : undefined,
    };

    return this.#call<SignRequest, SignResponse>(BankIdMethod.sign, parameters);
  }

  collect(parameters: CollectRequest) {
    return this.#call<CollectRequest, CollectResponse>(
      BankIdMethod.collect,
      parameters,
    );
  }

  cancel(parameters: CollectRequest): Promise<CancelResponse> {
    return this.#call<CollectRequest, CancelResponse>(
      BankIdMethod.cancel,
      parameters,
    );
  }

  /**
   * @deprecated Renamed to awaitPendingCollect
   */
  _awaitPendingCollect(orderRef: string) {
    console.warn("This method has been renamed to 'awaitPendingCollect");
    return this.awaitPendingCollect(orderRef);
  }

  async authenticateAndCollect(
    parameters: AuthRequestV5,
  ): Promise<CollectResponse> {
    const authResponse = await this.authenticate(parameters);
    return this.awaitPendingCollect(authResponse.orderRef);
  }

  async signAndCollect(parameters: SignRequest): Promise<CollectResponse> {
    const signResponse = await this.sign(parameters);
    return this.awaitPendingCollect(signResponse.orderRef);
  }

  /**
   * Polls BankID until the order is complete or failed.
   *
   * ⚠️  Vercel warning: This method uses setInterval and can run for 30-90 seconds.
   * Vercel Hobby functions time out at 10s, Pro at 60s.
   * For Vercel, prefer the stateless `collect()` method called from the client
   * on a timer, or use the helpers in `vercel-helpers.ts`.
   */
  awaitPendingCollect(orderRef: string): Promise<CollectResponse> {
    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        this.collect({ orderRef })
          .then(response => {
            if (response.status === "complete") {
              clearInterval(timer);
              resolve(response);
            } else if (response.status === "failed") {
              clearInterval(timer);
              reject(response);
            }
          })
          .catch(error => {
            clearInterval(timer);
            reject(error);
          });
      }, this.options.refreshInterval);
    });
  }

  #call<Req extends BankIdRequest, Res extends BankIdResponse>(
    method: BankIdMethod,
    payload: Req,
  ): Promise<Res> {
    return new Promise((resolve, reject) => {
      this.axios
        .post<Res>(method, payload)
        .then(response => {
          resolve(response.data);
        })
        .catch((error: unknown) => {
          let thrownError = error;

          if (axios.isAxiosError(error)) {
            if (error.response) {
              thrownError = new BankIdError(
                error.response.data.errorCode,
                error.response.data.details,
              );
            } else if (error.request) {
              thrownError = new RequestError(error.request);
            }
          }

          reject(thrownError);
        });
    });
  }

  createAxiosInstance(): AxiosInstance {
    const baseURL = this.options.production
      ? `https://appapi2.bankid.com/rp/${this.version}/`
      : `https://appapi2.test.bankid.com/rp/${this.version}/`;

    // Accept Buffer, PEM string, or base64 string for both pfx and ca
    const ca = Buffer.isBuffer(this.options.ca)
      ? this.options.ca
      : Buffer.from(this.options.ca as string, "utf-8");

    const pfx = Buffer.isBuffer(this.options.pfx)
      ? this.options.pfx
      : Buffer.from(this.options.pfx as string, "base64");

    const passphrase = this.options.passphrase;

    return axios.create({
      baseURL,
      httpsAgent: new https.Agent({ pfx, passphrase, ca }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

interface AuthOptionalRequirementsV6 {
  pinCode: boolean;
  cardReader?: "class1" | "class2";
  mrtd: boolean;
  certificatePolicies?: string[];
  personalNumber: string;
}

export interface AuthRequestV6 {
  endUserIp: string;
  requirement?: AuthOptionalRequirementsV6;
}

interface AuthResponseV6 extends AuthResponse {
  qr?: QrGenerator;
}

interface SignResponseV6 extends SignResponse {
  qr?: QrGenerator;
}

export interface CompletionDataV6 {
  user: {
    personalNumber: string;
    name: string;
    givenName: string;
    surname: string;
  };
  device: {
    ipAddress: string;
    uhi?: string;
  };
  /** ISO 8601 date format YYYY-MM-DD with a UTC time zone offset. */
  bankIdIssueDate: string;
  stepUp: boolean;
  signature: string;
  ocspResponse: string;
}

export interface CollectResponseV6
  extends Omit<CollectResponseV5, "completionData"> {
  completionData?: CompletionDataV6;
}

interface BankIdClientSettingsV6 extends BankIdClientSettings {
  /** Controls whether to attach an instance of {@link QrGenerator} to BankID responses  */
  qrEnabled?: boolean;
  qrOptions?: QrGeneratorOptions;
}

/**
 * A class for creating a BankId Client based on v6.0 api, extending from BankIdClient
 * @see https://www.bankid.com/en/utvecklare/guider/teknisk-integrationsguide/webbservice-api
 */
export class BankIdClientV6 extends BankIdClient {
  version = "v6.0";
  options: Required<BankIdClientSettingsV6>;

  constructor(options: BankIdClientSettingsV6) {
    super(options);
    this.axios = this.createAxiosInstance();
    this.options = {
      // @ts-expect-error this.options not typed after super() call.
      ...(this.options as Required<BankIdClientSettings>),
      qrEnabled: options.qrEnabled ?? true,
      qrOptions: options.qrOptions ?? QrGenerator.defaultOptions,
    };
  }

  /**
   * Create a BankIdClientV6 from environment variables.
   * @see BankIdClient.fromEnv
   */
  static fromEnv(options?: Omit<BankIdClientSettingsV6, "pfx" | "passphrase" | "production">): BankIdClientV6 {
    const production = process.env.BANKID_PRODUCTION === "true";
    const pfxB64 = process.env.BANKID_PFX_BASE64;
    const passphrase = process.env.BANKID_PASSPHRASE;

    if (production && (!pfxB64 || !passphrase)) {
      throw new Error(
        "Missing required env vars: BANKID_PFX_BASE64 and BANKID_PASSPHRASE must be set in production mode.",
      );
    }

    return new BankIdClientV6({
      ...options,
      production,
      pfx: pfxB64 ? Buffer.from(pfxB64, "base64") : undefined,
      passphrase: passphrase ?? undefined,
    });
  }

  async authenticate(parameters: AuthRequestV6): Promise<AuthResponseV6> {
    const resp = await super.authenticate(parameters);
    const qr = this.options.qrEnabled
      ? new QrGenerator(resp, this.options.qrOptions)
      : undefined;
    return { ...resp, qr };
  }

  async sign(parameters: SignRequest): Promise<SignResponseV6> {
    const resp = await super.sign(parameters);
    const qr = this.options.qrEnabled
      ? new QrGenerator(resp, this.options.qrOptions)
      : undefined;
    return { ...resp, qr };
  }

  async collect(parameters: CollectRequest) {
    return super.collect(parameters) as Promise<CollectResponseV6>;
  }
}
