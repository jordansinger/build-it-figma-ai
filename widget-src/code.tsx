import { OPENAI_API_KEY, drag } from "./helpers";

const { widget } = figma;
const { useEffect, Text, AutoLayout, useSyncedState } = widget;

const systemPrompt = `You are an expert web developer who specializes in tailwind css.
A user will provide you with a low-fidelity wireframe of an application. 
You will return a single html file that uses HTML, tailwind css, and JavaScript to create a high fidelity website.
Include any extra CSS and JavaScript in the html file.
If you have any images, load them from Unsplash or use solid colored retangles.
The user will provide you with notes in text, arrows, or drawings.
The user may also include images of other websites as style references. Transfer the styles as best as you can, matching fonts / colors / layouts.
They may also provide you with the html of a previous design that they want you to iterate from.
Carry out any changes they request from you.
In the wireframe, the previous design's html will appear as a white rectangle.
Use creative license to make the application more fleshed out.
Use JavaScript modules and unkpkg to import any necessary dependencies.

Respond ONLY with the contents of the html file.`;

export async function getHtmlFromOpenAI({
  image,
}: {
  image: string;
}): Promise<any> {
  const body: GPT4VCompletionRequest = {
    model: "gpt-4-vision-preview",
    max_tokens: 4096,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: image,
              detail: "high",
            },
          },
          {
            type: "text",
            text: "Turn this into a single html file using tailwind.",
          },
        ],
      },
    ],
  };

  let json = null;
  if (!OPENAI_API_KEY) {
    throw Error("You need to provide an OpenAI API key.");
  }

  try {
    const resp: Response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    json = await (
      resp as Response & { json: () => Promise<GPT4VCompletionRequest> }
    ).json();
  } catch (e) {
    console.log(e);
  }

  if (json !== null) {
    return json as GPT4VCompletionRequest;
  } else {
    throw new Error("Failed to get response from OpenAI API");
  }
}

type MessageContent =
  | string
  | (
      | string
      | {
          type: "image_url";
          image_url:
            | string
            | {
                url: string;
                detail: "low" | "high" | "auto";
              };
        }
      | {
          type: "text";
          text: string;
        }
    )[];

export type GPT4VCompletionRequest = {
  model: "gpt-4-vision-preview";
  messages: {
    role: "system" | "user" | "assistant" | "function";
    content: MessageContent;
    name?: string | undefined;
  }[];
  functions?: any[] | undefined;
  function_call?: any | undefined;
  stream?: boolean | undefined;
  temperature?: number | undefined;
  top_p?: number | undefined;
  max_tokens?: number | undefined;
  n?: number | undefined;
  best_of?: number | undefined;
  frequency_penalty?: number | undefined;
  presence_penalty?: number | undefined;
  logit_bias?:
    | {
        [x: string]: number;
      }
    | undefined;
  stop?: (string[] | string) | undefined;
};

function Widget() {
  // maintain loading state
  const [loading, setLoading] = useSyncedState("loading", false);

  const makeReal = async () => {
    if (!loading) {
      // require a selection
      if (figma.currentPage.selection.length === 0) {
        figma.notify("Make a selection first.");
        return;
      }

      setLoading(true);

      // group and export the image of the selection
      let group = figma.group(figma.currentPage.selection, figma.currentPage);
      const bytes = await group.exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: 1 },
      });
      figma.ungroup(group);

      // convert uint8array to base64
      let base64 = figma.base64Encode(bytes);
      base64 = "data:image/png;base64," + base64;

      // send image to openai

      await getHtmlFromOpenAI({
        image: base64,
      }).then((json) => {
        setLoading(false);
        const message = json.choices[0].message.content;
        const start = message.indexOf("<!DOCTYPE html>");
        const end = message.indexOf("</html>");
        let html = message.slice(start, end + "</html>".length);

        // insert drag before </html>
        const insertIndex = html.indexOf("</html>");
        html = html.slice(0, insertIndex) + drag + html.slice(insertIndex);
        console.log(html);

        // show UI of HTML response
        figma.showUI(__html__, { width: 800, height: 600 });
        // post message to UI
        figma.ui.postMessage({
          type: "renderHTML",
          html: html,
        });
      });
    }
  };

  useEffect(() => {
    figma.ui.onmessage = (msg) => {
      // resize the plugin window
      if (msg.type === "resize") {
        figma.ui.resize(msg.size.width, msg.size.height);
      }
    };
  });

  return (
    <AutoLayout
      width={256}
      height={40}
      horizontalAlignItems="center"
      verticalAlignItems="center"
      cornerRadius={13}
      fill={loading ? "#D9D9D9" : "#0D99FF"}
      onClick={
        () =>
          new Promise((resolve) => {
            makeReal();
          })
      }
    >
      <Text fontSize={12} fontWeight={500} fill={"#fff"}>
        {loading ? "Loading..." : "✨ Build it"}
      </Text>
    </AutoLayout>
  );
}

widget.register(Widget);
