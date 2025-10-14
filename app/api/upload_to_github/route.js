import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export async function POST(req) {
  try {
    const { base64File, folder, fileName } = await req.json();

    if (!base64File || !folder || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_PAT,
    });

    const path = `livefiles/${folder}/${fileName}`;

    // create or update file
    await octokit.repos.createOrUpdateFileContents({
      owner: "ibkrebecca",
      repo: "naurs_ipad",
      path,
      message: `Upload ${fileName}`,
      content: base64File,
      branch: "main",
    });

    // construct raw URL
    const rawUrl = `https://raw.githubusercontent.com/ibkrebecca/naurs_ipad/main/${path}`;

    return NextResponse.json({ rawUrl });
  } catch (err) {
    console.error("GitHub upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload file to GitHub" },
      { status: 500 }
    );
  }
}
