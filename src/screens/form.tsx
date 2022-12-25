import { Form, ActionPanel, Action, useNavigation, Clipboard, showToast, Toast } from "@raycast/api";
import { useRef, useState } from "react";
import { Source, useCache } from "../hooks/cache";
import { GridScreen } from "./grid";

export type Values = {
  files: string[];
};

export type GlobalPreference = {
  proxy: string;
};

export function FormScreen(props: { source: Source; onUpload: (filePath: string) => Promise<{ url: string }> }) {
  const { push } = useNavigation();
  const { onUpload, source } = props;

  const toGrid = () => {
    push(<GridScreen />);
  };

  const { addImage } = useCache(toGrid);
  const filePickerRef = useRef<Form.FilePicker | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = (values: Values, copy: boolean) => {
    if (values && values.files[0]) {
      setLoading(true);
      onUpload(values.files[0])
        .then(({ url }) => {
          if (copy) {
            typeof url === "string"
              ? Clipboard.copy(url)
              : showToast({ title: "Copy Failed", message: "Can not get url", style: Toast.Style.Failure });
          }
          filePickerRef.current?.reset();
          addImage(url, source);
          showToast({ title: "Succesfully Uploaded" });
          toGrid();
        })
        .catch((err) => {
          showToast({ title: "Upload Failed", message: err, style: Toast.Style.Failure });
        })
        .finally(() => setLoading(false));
    } else {
      showToast({ title: "Upload Failed", message: "Please choose a file", style: Toast.Style.Failure });
    }
  };

  return (
    <Form
      isLoading={loading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Upload and Copy" onSubmit={(values: Values) => handleUpload(values, true)} />
          <Action.SubmitForm title="Upload" onSubmit={(values: Values) => handleUpload(values, false)} />
          <Action
            title="List Uploaded Images"
            onAction={toGrid}
            shortcut={{
              modifiers: ["shift"],
              key: "tab",
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Description text="Select Image to Upload" />
      <Form.FilePicker
        id="files"
        ref={(ref) => (filePickerRef.current = ref)}
        title="Image"
        allowMultipleSelection={false}
      />
    </Form>
  );
}
