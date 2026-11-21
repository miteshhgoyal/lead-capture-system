/** Meta webhook fixtures (shapes follow the Instagram Platform webhook docs; re-verify before launch). */
export const ACCOUNT = "17841400000000001";
export const USER = "17841499999999999";
const t = 1_700_000_000;

export const comment = { object: "instagram", entry: [{ id: ACCOUNT, time: t, changes: [{ field: "comments", value: { id: "c1", text: "GUIDE please", from: { id: USER, username: "fan" }, media: { id: "m1", media_product_type: "REELS" } } }] }] };
export const selfComment = { object: "instagram", entry: [{ id: ACCOUNT, time: t, changes: [{ field: "comments", value: { id: "c2", text: "thanks!", from: { id: ACCOUNT, username: "me" }, media: { id: "m1" } } }] }] };
export const dm = { object: "instagram", entry: [{ id: ACCOUNT, time: t, messaging: [{ sender: { id: USER }, recipient: { id: ACCOUNT }, timestamp: t * 1000, message: { mid: "mid1", text: "price?" } }] }] };
export const echo = { object: "instagram", entry: [{ id: ACCOUNT, time: t, messaging: [{ sender: { id: ACCOUNT }, recipient: { id: USER }, timestamp: t * 1000, message: { mid: "mid2", text: "our reply", is_echo: true } }] }] };
export const storyReply = { object: "instagram", entry: [{ id: ACCOUNT, time: t, messaging: [{ sender: { id: USER }, recipient: { id: ACCOUNT }, timestamp: t * 1000, message: { mid: "mid3", text: "love it", reply_to: { story: { id: "st1", url: "https://cdn/story" } } } }] }] };
export const storyMention = { object: "instagram", entry: [{ id: ACCOUNT, time: t, messaging: [{ sender: { id: USER }, recipient: { id: ACCOUNT }, timestamp: t * 1000, message: { mid: "mid4", attachments: [{ type: "story_mention", payload: { url: "https://cdn/s", id: "st2" } }] } }] }] };
export const postback = { object: "instagram", entry: [{ id: ACCOUNT, time: t, messaging: [{ sender: { id: USER }, recipient: { id: ACCOUNT }, timestamp: t * 1000, postback: { mid: "mid5", title: "Get link", payload: "GET_LINK" } }] }] };
export const read = { object: "instagram", entry: [{ id: ACCOUNT, time: t, messaging: [{ sender: { id: USER }, recipient: { id: ACCOUNT }, timestamp: t * 1000, read: { mid: "mid1" } }] }] };
export const fbComment = { object: "page", entry: [{ id: "page1", time: t, changes: [{ field: "feed", value: { item: "comment", verb: "add", comment_id: "fc1", post_id: "p1", parent_id: "p1", message: "info", from: { id: "u1", name: "Pat" }, created_time: t } }] }] };
export const unknownObject = { object: "whatsapp_business_account", entry: [{ id: "1" }] };
