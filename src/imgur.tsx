import {
  getPreferenceValues,
  OAuth,
  showToast,
  Toast,
  confirmAlert,
  Form,
  Action,
  Clipboard,
  open,
} from "@raycast/api";
import { Imgur, Raycast } from "./hooks/urls";
import { FormScreen, GlobalPreference } from "./screens/form";
import { createReadStream } from "fs";
import { Source } from "./hooks/cache";
import FormData from "form-data";
import { Axios, AxiosResponse } from "axios";
import { Fragment } from "react";

type Prefrences = {
  clientId: string;
  clientSecret: string;
} & GlobalPreference;

type Success = {
  id: string;
  title: string | null;
  description: string | null;
  datetime: number;
  type: string;
  animated: boolean;
  width: number;
  height: number;
  size: number;
  views: number;
  bandwidth: number;
  vote: number | null;
  favorite: boolean;
  nsfw: null;
  section: null;
  account_url: string | null;
  account_id: number;
  is_ad: boolean;
  in_most_viral: boolean;
  tags: string[];
  ad_type: number;
  ad_url: string;
  in_gallery: boolean;
  deletehash: string;
  name: string;
  link: string;
};

type Error = {
  error: string;
  request: string;
  method: string;
};

type Response = {
  success: boolean;
  status: number;
  data: Success | Error;
};

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
  account_username: string;
  account_id: number;
  scope: "";
};

const { clientId, clientSecret, proxy } = getPreferenceValues<Prefrences>();

const client = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.Web,
  providerName: "Imgur",
  providerIcon: "command-icon.png",
  description: `Connect your Imgur account... Ensure that you have set Imgur's application Redirect(callback url) to <${Raycast.OAuthCallack}>`,
});

const refreshTokens = async (refreshToken: string) => {
  const axiosClient = new Axios({
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  const form = new URLSearchParams();
  form.append("refresh_token", refreshToken);
  form.append("client_id", clientId);
  form.append("client_secret", clientSecret);
  form.append("client_secret", "refresh_token");
  const res = await axiosClient.post<string, AxiosResponse<string>>(Imgur.TokenURL, form.toString());
  console.log(res.statusText);
  if (res.statusText === "ok") {
    console.log("refresh success");
    return JSON.parse(res.data) as TokenResponse;
  } else {
    throw "Refresh token failed";
  }
};

const execOAuth = async (tokenSet?: OAuth.TokenSet) => {
  if (tokenSet && tokenSet.accessToken) {
    if (tokenSet.refreshToken && tokenSet.isExpired()) {
      await client.setTokens(await refreshTokens(tokenSet.refreshToken)).catch((err) => {
        showToast({ title: "OAuth Failed", message: err, style: Toast.Style.Failure });
      });

      return client.getTokens();
    }
    return client.getTokens();
  }
  const req = await client.authorizationRequest({
    endpoint: Imgur.AuthorizeURL,
    clientId: clientId,
    scope: "",
  });
  const { authorizationCode } = await client.authorize(req);
  const axiosClient = new Axios({
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  const form = new URLSearchParams();
  form.append("code", authorizationCode);
  form.append("code_verifier", req.codeVerifier);
  form.append("client_id", clientId);
  form.append("client_secret", clientSecret);
  form.append("grant_type", "authorization_code");
  form.append("redirect_uri", req.redirectURI);
  const tokenRes = await axiosClient.post<string, AxiosResponse<string>>(Imgur.TokenURL, form.toString());
  client.setTokens(JSON.parse(tokenRes.data) as TokenResponse);
  return client.getTokens();
};

client
  .getTokens()
  .then(async (tokenSet) => {
    return execOAuth(tokenSet);
  })
  .catch((err) => {
    showToast({ title: "OAuth Failed", message: err, style: Toast.Style.Failure });
  });

export default function Command() {
  const handleUpload = async (filePath: string) => {
    const ifTokenSet = await client.getTokens();
    const tokenSet = await execOAuth(ifTokenSet).catch((err) => {
      showToast({ title: "OAuth Failed", message: err, style: Toast.Style.Failure });
    });

    const execUpload = async (token?: string) => {
      const axiosClient = new Axios({
        headers: {
          Authorization: token ? `Bearer ${token}` : `Client-ID ${clientId}`,
          "Content-Type": "multipart/form-data",
        },
      });
      const formData = new FormData();
      formData.append("image", createReadStream(filePath));
      formData.append("type", "file");
      return axiosClient.post<FormData, AxiosResponse<string>>(Imgur.UploadURL, formData).then((res) => {
        const response: Response = JSON.parse(res.data);
        if (response.success) {
          const url = (response.data as Success).link;
          return { url };
        } else {
          throw (response.data as Error).error;
        }
      });
    };

    if (!tokenSet || !tokenSet.accessToken) {
      return new Promise<{ url: string }>((reslove, reject) => {
        confirmAlert({
          title: "Can't sign in Imgur",
          message: "Do you want to upload as guest?",
          primaryAction: {
            title: "Upload as Guest",
            onAction: async () => {
              const res = await execUpload();
              reslove(res);
            },
          },
          dismissAction: {
            title: "Cancel",
            onAction: async () => {
              reject("Upload Canceled");
            },
          },
        });
      });
    }

    return await execUpload(tokenSet.accessToken);
  };

  return (
    <FormScreen
      source={Source.SMMS}
      onUpload={handleUpload}
      formItems={() => (
        <Fragment>
          <Form.Separator />
          <Form.Description title={"Important"} text={`Here is the steps to prepare for sign in Imgur.`} />
          <Form.Description text={`1. [⌥ + ⌘ + c] to copy Redirect url.`} />
          <Form.Description text={`2. [⌥ + ⌘ + o] to open Imgur App settings page.`} />
          <Form.Description text={`3. Edit Redirect and Paste link into Input and save.`} />
        </Fragment>
      )}
      actions={() => (
        <Fragment>
          <Action
            title="Copy Ridirect Url"
            shortcut={{
              modifiers: ["opt", "cmd"],
              key: "c",
            }}
            onAction={() => Clipboard.copy(Raycast.OAuthCallack)}
          />
          <Action
            title="Open Imgur App Settings"
            shortcut={{
              modifiers: ["opt", "cmd"],
              key: "o",
            }}
            onAction={() => {
              open(Imgur.AppSettingsPage);
            }}
          />
        </Fragment>
      )}
    />
  );
}
