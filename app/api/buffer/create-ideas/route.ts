import { NextResponse } from "next/server";

const BUFFER_ORGANIZATION_ID = "687880bd75ffe60432da70c6";

export async function POST(req: Request) {
  try {
    const { title, posts } = await req.json();
    // posts expected to be: { facebook: string, instagram: string, pinterest: string }

    const token = process.env.BUFFER_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "BUFFER_ACCESS_TOKEN is not configured in .env.local" },
        { status: 400 }
      );
    }

    const platforms = [
      { name: "Facebook", text: posts.facebook },
      { name: "Instagram", text: posts.instagram },
      { name: "Pinterest", text: posts.pinterest },
    ];

    const results = [];

    for (const platform of platforms) {
      if (!platform.text) continue;

      const query = `
        mutation CreateIdea($input: CreateIdeaInput!) {
          createIdea(input: $input) {
            ... on Idea {
              id
              content {
                title
                text
              }
            }
            ... on MutationError {
              message
            }
          }
        }
      `;

      const response = await fetch("https://api.buffer.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          variables: {
            input: {
              organizationId: BUFFER_ORGANIZATION_ID,
              content: {
                title: `${platform.name} - ${title || "Social Post"}`,
                text: platform.text,
              },
            },
          },
        }),
      });

      const data = await response.json();
      results.push({ platform: platform.name, data });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Buffer API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Buffer ideas" },
      { status: 500 }
    );
  }
}
