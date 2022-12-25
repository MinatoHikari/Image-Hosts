import { getPreferenceValues } from "@raycast/api";
import { Catbox } from "./hooks/urls";
import { createReadStream } from "fs";
import { Source } from "./hooks/cache";
import FormData from "form-data";
import axios from "axios";
import { FormScreen, GlobalPreference } from "./screens/form";

type Prefrences = {
  userhash: string;
} & GlobalPreference;

export default async function Command() {
  const { userhash } = getPreferenceValues<Prefrences>();

  const handleUpload = async (filePath: string) => {
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("userhash", userhash);
    formData.append("fileToUpload", createReadStream(filePath));
    return axios.post(Catbox.UploadURL, formData, {}).then((res) => {
      if (res.data) {
        const url = res.data;
        return { url };
      } else {
        throw "Can not get url";
      }
    });
  };

  return <FormScreen source={Source.Catbox} onUpload={handleUpload} />;
}
