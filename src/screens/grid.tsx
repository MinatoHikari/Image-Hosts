import {
  Action,
  ActionPanel,
  Grid,
  Clipboard,
  closeMainWindow,
  popToRoot,
  useNavigation,
  confirmAlert,
} from "@raycast/api";
import { useCache } from "../hooks/cache";

export function GridScreen(props: { showUploadImage?: boolean } = { showUploadImage: true }) {
  const { pop } = useNavigation();
  const { imageList, removeImage } = useCache();
  const { showUploadImage } = props;

  const copyAndClose = (src: string) => {
    Clipboard.copy(src);
    popToRoot();
    closeMainWindow();
  };

  const remove = (src: string) => {
    confirmAlert({
      title: "Confirm",
      message: "The image will be removed, are you sure?",
      primaryAction: {
        title: "Remove",
        onAction: () => {
          removeImage(src);
        },
      },
    });
  };

  return (
    <Grid>
      {imageList.map((i) => (
        <Grid.Item
          key={i.src}
          title={i.src.split("/").at(-1)}
          content={{
            source: i.src,
          }}
          actions={
            <ActionPanel>
              <Action title="Copy" onAction={() => Clipboard.copy(i.src)} />
              <Action title="Copy and Close" onAction={() => copyAndClose(i.src)} />
              <Action
                title="Remove from local album"
                onAction={() => remove(i.src)}
                shortcut={{
                  modifiers: ["cmd"],
                  key: "d",
                }}
              />
              {showUploadImage && (
                <Action
                  title="Upload Image"
                  onAction={pop}
                  shortcut={{
                    modifiers: ["shift"],
                    key: "tab",
                  }}
                />
              )}
            </ActionPanel>
          }
        />
      ))}
    </Grid>
  );
}
