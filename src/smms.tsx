import { getPreferenceValues } from "@raycast/api";
import { SMMS } from "./hooks/urls";
import { FormScreen, GlobalPreference } from "./screens/form";
import { createReadStream } from "fs";
import { Source } from "./hooks/cache";
import FormData from "form-data";
import { Axios, AxiosResponse } from "axios";

type Prefrences = {
  token: string;
} & GlobalPreference;

type Response = {
  success: boolean;
  code: string;
  message: string;
  RequestId: string;
  data: {
    filename: string;
    storename: string;
    size: number;
    path: string;
    hash: string;
    url: string;
    delete: string;
    page: string;
  };
};

export default function Command() {
  const { token } = getPreferenceValues<Prefrences>();

  const handleUpload = async (filePath: string) => {
    const client = new Axios({
      headers: {
        Authorization: token,
        "Content-Type": "multipart/form-data",
      },
    });
    const formData = new FormData();
    formData.append("smfile", createReadStream(filePath));
    formData.append("format", "json");
    return client.post<FormData, AxiosResponse<string>>(SMMS.UploadURL, formData).then((res) => {
      const response: Response = JSON.parse(res.data);
      if (response.success) {
        const url = response.data.url;
        return { url };
      } else {
        throw response.message;
      }
    });
  };

  return <FormScreen source={Source.SMMS} onUpload={handleUpload} />;
}
