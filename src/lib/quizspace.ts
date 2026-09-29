// Links to Quiz Space (quizspace.unknowniitians.com), Unknown IITians' site for
// practising IITM BS previous year papers question by question, with answer
// keys and timed mock tests.
//
// Every link here points at a page that exists on Quiz Space, so a link is
// never broken. Plain URLs, no tracking parameters: they would only create
// duplicate addresses for search engines.
//
// The same links appear in the crawler HTML (api/seo.ts), so search engines
// see what visitors see.

export const QUIZ_SPACE = "https://quizspace.unknowniitians.com";

export interface QuizSpaceLink {
  href: string;
  label: string;
}

// Each of this site's IITM BS PYQ papers → the Quiz Space page with the same
// sitting: that exam's page for the year, at the term the paper belongs to.
// Matched by exam and date (September 2026). A paper that is not here — OPPE,
// which Quiz Space does not have, a sitting it does not have, or a paper added
// later — goes to Quiz Space's home page.
const PAPERS: Record<string, string> = {
  "12ed15bb-83bb-4ddf-a217-c9e467bf9e28": "/exam/end-term/2024#t-2024-may",
  "19def22a-6c32-4e33-82b6-d01caae7c060": "/exam/end-term/2024#t-2024-may",
  "2bc5c87c-606f-423d-9b3d-33c0425107fb": "/exam/end-term/2024#t-2024-may",
  "33eee8c4-1db6-4e90-8de9-08f8ebf7871e": "/exam/end-term/2024#t-2024-may",
  "352c5dc1-2d44-4c08-8d8b-aa6dab69efe6": "/exam/end-term/2024#t-2024-may",
  "4dae319c-f828-4bb9-85b2-21ddc500a302": "/exam/end-term/2024#t-2024-may",
  "729edc06-e6c9-4b1c-8922-3443c0f1a03c": "/exam/end-term/2024#t-2024-may",
  "928d943e-199e-46e9-8eb2-00a4a38b4390": "/exam/end-term/2024#t-2024-may",
  "a4f3ff39-a78c-4bde-8389-838621d35be7": "/exam/end-term/2024#t-2024-may",
  "a90c4ac9-6764-48f7-bb1e-ed5e1f77dd49": "/exam/end-term/2024#t-2024-may",
  "b40ea6ca-3196-473f-9f19-2a646a278ae2": "/exam/end-term/2024#t-2024-may",
  "c64de9bc-2930-4553-bd67-e314665286e1": "/exam/end-term/2024#t-2024-may",
  "c6e8bc0b-a98e-4ee3-9e04-02e47b77781f": "/exam/end-term/2024#t-2024-may",
  "cadca530-2682-4255-92f4-fd5938b9f2b7": "/exam/end-term/2024#t-2024-may",
  "ee570017-335a-4dac-8611-844f2ee3658a": "/exam/end-term/2024#t-2024-may",
  "fc322f7c-2d35-4063-82c5-9c12080e3711": "/exam/end-term/2024#t-2024-may",
  "035e4bd6-bfd1-40b8-9d0f-787f06324ded": "/exam/end-term/2024#t-2024-sep",
  "1dd454ff-aa6d-49f5-a05a-8926d083bf2e": "/exam/end-term/2024#t-2024-sep",
  "34a052a2-84e7-41fd-912a-b3bd1fdb8964": "/exam/end-term/2024#t-2024-sep",
  "45b3be37-dc17-4bbb-bf5f-66d933edd959": "/exam/end-term/2024#t-2024-sep",
  "46b66680-6e01-4ed6-9100-1261a2e0625f": "/exam/end-term/2024#t-2024-sep",
  "5e3c801b-bc9c-4270-b5da-1e8525a682eb": "/exam/end-term/2024#t-2024-sep",
  "66c62ed1-864b-45e3-9fe6-3fe6dddf1c8d": "/exam/end-term/2024#t-2024-sep",
  "69e00942-36eb-492c-a694-ede8b819af06": "/exam/end-term/2024#t-2024-sep",
  "8695db92-ad74-4c2b-b048-8d12a9744f7d": "/exam/end-term/2024#t-2024-sep",
  "89ea9379-3448-4bd2-904d-42cd288a664b": "/exam/end-term/2024#t-2024-sep",
  "9c5c4e68-175b-491a-9acb-26c48cd4ef89": "/exam/end-term/2024#t-2024-sep",
  "a7d60e59-d046-4520-a316-e282fe3744b5": "/exam/end-term/2024#t-2024-sep",
  "c0a4e0b3-d236-4869-8ea8-33ca4a965e09": "/exam/end-term/2024#t-2024-sep",
  "cf7260c6-672b-40a3-a493-ec399ed48c86": "/exam/end-term/2024#t-2024-sep",
  "ebbaef8e-c639-46b8-955e-57ec81597774": "/exam/end-term/2024#t-2024-sep",
  "fa4b13cf-3033-4818-bae9-43038dfeabcd": "/exam/end-term/2024#t-2024-sep",
  "239a272e-d05c-45b2-b4b4-bc8d8cbc270b": "/exam/quiz-1/2021#t-2021-may",
  "45137e47-423b-4b03-ad3a-89ddb772db79": "/exam/quiz-1/2021#t-2021-may",
  "80d4be4b-da84-4cba-8103-d7fa9f2f2253": "/exam/quiz-1/2021#t-2021-may",
  "f1d532ec-a006-4960-af16-99bb731e06a1": "/exam/quiz-1/2021#t-2021-may",
  "0441bee2-5eb9-4455-8aa9-914244db21eb": "/exam/quiz-1/2021#t-2021-sep",
  "9318c76c-9d79-495f-b3b3-0646a3c2fe39": "/exam/quiz-1/2021#t-2021-sep",
  "a7ec7c4d-44d7-42d8-98c1-adaf32cdca54": "/exam/quiz-1/2022#t-2022-jan",
  "b85ab84c-053a-4b1f-b36b-04987494df78": "/exam/quiz-1/2022#t-2022-jan",
  "be79d72c-8ef7-438d-a880-e789f242d341": "/exam/quiz-1/2022#t-2022-jan",
  "bf17e849-5998-47b1-aab4-b7caacbab90f": "/exam/quiz-1/2022#t-2022-jan",
  "cf5beb88-7156-493e-8f03-79bd86a76643": "/exam/quiz-1/2022#t-2022-jan",
  "d786224f-24c5-4dec-b67a-f0b6aef7cd2f": "/exam/quiz-1/2022#t-2022-jan",
  "316ed05c-b509-47ad-a077-86a8acbb212c": "/exam/quiz-1/2022#t-2022-may",
  "37322395-bf96-4027-8233-a20f5375544f": "/exam/quiz-1/2022#t-2022-may",
  "6eb6d43b-6bc0-4e7c-87a3-d0db8e89a845": "/exam/quiz-1/2022#t-2022-may",
  "7cb32d1f-4018-40ed-8173-078f1ce6683c": "/exam/quiz-1/2022#t-2022-may",
  "940851e1-1d7d-4e77-95be-ed582a06cbe9": "/exam/quiz-1/2022#t-2022-may",
  "ab6ea24a-500b-45f2-90bc-88e9cf0af992": "/exam/quiz-1/2022#t-2022-may",
  "e3e4c474-aa66-440f-9c85-f097d749ef8b": "/exam/quiz-1/2022#t-2022-may",
  "e7dde983-9e37-4203-a66a-aeb1ff6f937f": "/exam/quiz-1/2022#t-2022-may",
  "1eb18215-6591-4b01-bc23-34bca8a08bd8": "/exam/quiz-1/2023#t-2023-jan",
  "3ee5c022-6788-43e5-9e22-7193354011b3": "/exam/quiz-1/2023#t-2023-jan",
  "2d99aa43-b39c-46df-979f-71ca4ea1f5db": "/exam/quiz-1/2023#t-2023-may",
  "b3e52b68-9519-4fe3-97b2-9bcdb48933c1": "/exam/quiz-1/2023#t-2023-may",
  "d8a09fa2-9cf3-4a42-9a9c-80155578f50a": "/exam/quiz-1/2023#t-2023-may",
  "efd46bd6-2f7e-4861-bd2a-3b8b590dd273": "/exam/quiz-1/2023#t-2023-may",
  "07063e0c-f5cb-4041-b3c4-d50bb81b1d42": "/exam/quiz-1/2023#t-2023-sep",
  "1f2f90a2-262c-4f1d-bec6-69c59b53dec0": "/exam/quiz-1/2023#t-2023-sep",
  "32b628a2-5cea-4747-abed-48f3f027f121": "/exam/quiz-1/2023#t-2023-sep",
  "4872de9b-477c-4229-9985-ae186fd948e8": "/exam/quiz-1/2023#t-2023-sep",
  "b2f581ef-0aaa-485d-91dc-071bbec4cf59": "/exam/quiz-1/2023#t-2023-sep",
  "cd08af85-4969-45a8-8e73-db8b0589345f": "/exam/quiz-1/2023#t-2023-sep",
  "d36a7e57-cc64-425d-965e-411390e2a439": "/exam/quiz-1/2023#t-2023-sep",
  "dbe8d737-bc33-4762-bd00-7a7db848d8c3": "/exam/quiz-1/2023#t-2023-sep",
  "e383f079-3cc5-473e-94ad-5a703dc685a6": "/exam/quiz-1/2023#t-2023-sep",
  "e66cce4f-1481-4b44-a808-60d01984683f": "/exam/quiz-1/2023#t-2023-sep",
  "1ce0fb22-8cfb-4186-876c-d59862034b05": "/exam/quiz-1/2024#t-2024-jan",
  "3b77780a-6524-44fa-a633-c2bf5427ab52": "/exam/quiz-1/2024#t-2024-jan",
  "593c83ea-8327-4b1d-b7d4-db8a4f371370": "/exam/quiz-1/2024#t-2024-jan",
  "6015e1c5-fc8d-45ba-8185-d5b19fee00bd": "/exam/quiz-1/2024#t-2024-jan",
  "614ff3fe-ea62-4092-9eb0-1518e7c2186e": "/exam/quiz-1/2024#t-2024-jan",
  "e0fc1a65-3c9b-4e15-8fc3-60aa8f457666": "/exam/quiz-1/2024#t-2024-jan",
  "1a010b5b-99a7-49ee-8947-64ca27096e0f": "/exam/quiz-1/2024#t-2024-may",
  "1f27e320-cc9b-47a3-b391-dccb86461992": "/exam/quiz-1/2024#t-2024-may",
  "326a0272-6f05-4885-ab2a-d2d020db0d22": "/exam/quiz-1/2024#t-2024-may",
  "45d26ba3-133f-4184-9ba4-be86e211f75d": "/exam/quiz-1/2024#t-2024-may",
  "a186443b-2a71-4592-84bf-c744e66687c4": "/exam/quiz-1/2024#t-2024-may",
  "a38c3b52-f773-453d-8521-0cdacde58883": "/exam/quiz-1/2024#t-2024-may",
  "039815c6-24c0-436f-a8bc-af72b425e38c": "/exam/quiz-1/2024#t-2024-sep",
  "2e3b8d51-01ed-4a7a-9be8-13d512ccf199": "/exam/quiz-1/2024#t-2024-sep",
  "3b187249-b375-4a18-a94a-a9a4183692a3": "/exam/quiz-1/2024#t-2024-sep",
  "9889b657-8391-42af-9331-243443d42f35": "/exam/quiz-1/2024#t-2024-sep",
  "c3fb4501-8154-441e-af95-c009448232ca": "/exam/quiz-1/2024#t-2024-sep",
  "d9dc16ee-12b8-457d-94ae-066dd05ebcf9": "/exam/quiz-1/2024#t-2024-sep",
  "0cfe30dd-9143-4aab-bd77-cbdeeadcf860": "/exam/quiz-2/2024#t-2024-may",
  "1f17a9c7-4320-4b38-9527-6a87479deb16": "/exam/quiz-2/2024#t-2024-may",
  "2bb48a32-94d1-48e5-83d7-a4804bc7ead7": "/exam/quiz-2/2024#t-2024-may",
  "9e3c2066-60e9-4410-9b05-1834b33ee9d3": "/exam/quiz-2/2024#t-2024-may",
  "aeb51fcd-c986-4f75-bde4-e3c20d152a07": "/exam/quiz-2/2024#t-2024-may",
  "d9f22374-fb56-4baa-9e53-7ef178831751": "/exam/quiz-2/2024#t-2024-may",
  "3bc2202a-7d1d-48da-b170-fdb5d7d3be6e": "/exam/quiz-2/2024#t-2024-sep",
  "59f1fc4f-697a-46d9-98a6-a27600a47387": "/exam/quiz-2/2024#t-2024-sep",
  "5adcb17e-c825-408c-962f-2c3bb9a9a461": "/exam/quiz-2/2024#t-2024-sep",
  "e9598a3a-94a4-497f-83b9-8ff0d05e6c96": "/exam/quiz-2/2024#t-2024-sep",
  "f700a0d6-efb2-440a-ac74-7af6afbe012f": "/exam/quiz-2/2024#t-2024-sep",
  "fdb2180a-70fe-467a-b145-899851e6fe29": "/exam/quiz-2/2024#t-2024-sep",
};

/** Where "Practise on Quiz Space" takes a paper: its sitting, or Quiz Space's home page. */
export function quizSpaceForPaper(paperId: string): string {
  const path = PAPERS[paperId];
  return path ? `${QUIZ_SPACE}${path}` : QUIZ_SPACE;
}

/** The Quiz Space page for a branch and level of the PYQs tab. */
export function quizSpaceLevelLink(branch: string, level: string): QuizSpaceLink {
  const programme = branch === "electronic-systems" ? "electronic-systems" : "data-science";
  const branchName = programme === "electronic-systems" ? "Electronic Systems" : "Data Science";
  switch (level) {
    case "foundation":
      return { href: `${QUIZ_SPACE}/program/${programme}/foundation`, label: `IITM BS ${branchName} Foundation PYQs with solutions` };
    case "diploma":
      return programme === "electronic-systems"
        ? { href: `${QUIZ_SPACE}/program/electronic-systems/diploma`, label: "IITM BS Electronic Systems Diploma PYQs with solutions" }
        : { href: `${QUIZ_SPACE}/program/data-science`, label: "IITM BS Data Science Diploma PYQs with solutions" };
    case "degree":
      return { href: `${QUIZ_SPACE}/program/${programme}/bs`, label: `IITM BS ${branchName} Degree PYQs with solutions` };
    default:
      return { href: `${QUIZ_SPACE}/program/${programme}`, label: `IITM BS ${branchName} PYQs with solutions` };
  }
}

/** The links every page carries in its footer (and its crawler HTML). */
export const QUIZ_SPACE_FOOTER_LINKS: QuizSpaceLink[] = [
  { href: QUIZ_SPACE, label: "Practise IITM BS PYQs online — Quiz Space" },
  { href: `${QUIZ_SPACE}/exam/qualifier`, label: "IITM BS Qualifier PYQs with solutions" },
  { href: `${QUIZ_SPACE}/exam/quiz-1`, label: "IITM BS Quiz 1 PYQs with solutions" },
  { href: `${QUIZ_SPACE}/exam/quiz-2`, label: "IITM BS Quiz 2 PYQs with solutions" },
  { href: `${QUIZ_SPACE}/exam/end-term`, label: "IITM BS End Term PYQs with solutions" },
];
