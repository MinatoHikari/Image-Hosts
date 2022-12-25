import { Action, ActionPanel, Grid, Clipboard, closeMainWindow, popToRoot, useNavigation } from "@raycast/api";
import { useCache } from "../hooks/cache";

export function GridScreen(props: { showUploadImage?: boolean } = { showUploadImage: true }) {
  const { pop } = useNavigation();
  const { imageList } = useCache();
  const { showUploadImage } = props;

  const copyAndClose = (src: string) => {
    Clipboard.copy(src);
    popToRoot();
    closeMainWindow();
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
