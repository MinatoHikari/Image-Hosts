import { getPreferenceValues } from "@raycast/api";
import { ImgURL } from "./hooks/urls";
import { FormScreen, GlobalPreference } from "./screens/form";
import { createReadStream } from "fs";
import { Source } from "./hooks/cache";
import FormData from "form-data";
import { Axios, AxiosResponse } from "axios";

type Prefrences = {
  token: string;
  uid: string;
  hostname: string;
} & GlobalPreference;

type Response = {
  code: number;
  msg: string;
  data: {
    relative_path: string;
    url: string;
    thumbnail_url: string;
    image_width: number;
    image_height: number;
    client_name: string;
    id: number;
    imgid: string;
    delete: string;
  };
};

export default function Command() {
  const { token, uid, hostname } = getPreferenceValues<Prefrences>();
  const url = `${hostname || "https://www.imgurl.org"}${ImgURL.UploadPath}`;

  const handleUpload = async (filePath: string) => {
    const client = new Axios({
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    const formData = new FormData();
    formData.append("file", createReadStream(filePath));
    formData.append("token", token);
    formData.append("uid", uid);
    return client.post<FormData, AxiosResponse<string>>(url, formData).then((res) => {
      const response: Response = JSON.parse(res.data);
      if (!response.msg) {
        const url = response.data.url;
        return { url };
      } else {
        throw response.msg;
      }
    });
  };

  return <FormScreen source={Source.ImgURL} onUpload={handleUpload} />;
}
