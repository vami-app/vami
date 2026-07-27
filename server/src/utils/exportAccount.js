const TurndownService = require("turndown");
const turndown = new TurndownService();

/**
 * Stream a zip export of user profile, posts, and sovereign payment-relationships.
 * Supports both streamExport(user, res) and streamExport(res, user, posts).
 * @returns {Promise<void>}
 */
async function streamExport(arg1, arg2, arg3) {
  let user, res, posts;

  if (arg1 && typeof arg1.pipe === "function") {
    res = arg1;
    user = arg2;
    posts = arg3;
  } else if (arg2 && typeof arg2.pipe === "function") {
    user = arg1;
    res = arg2;
    posts = arg3;
  } else {
    user = arg1;
    res = arg2;
    posts = arg3;
  }

  if (!user || !res) {
    throw new Error("Invalid parameters passed to streamExport");
  }

  if (!posts) {
    const Post = require("../models/Post");
    posts = await Post.find({ author: user._id });
  }

  if (typeof res.setHeader === "function") {
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="inkwell-sovereign-export.zip"');
  }

  const { ZipArchive } = await import("archiver");
  const archive = new ZipArchive({ zlib: { level: 9 } });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(res);

  // 1. Add profile.json
  const profileJson = typeof user.toPublicJSON === "function" ? user.toPublicJSON(true) : { _id: user._id, name: user.name, email: user.email };
  archive.append(JSON.stringify(profileJson, null, 2), {
    name: "profile.json",
  });

  // 1b. Add followers.json
  const Follow = require("../models/Follow");
  const follows = await Follow.find({ followee: user._id }).populate("follower");
  const followersIndex = follows.map((f) => ({
    name: f.follower ? f.follower.name : "Deleted User",
    email: f.follower ? f.follower.email : "",
    followedAt: f.followedAt,
    sourcePost: f.sourcePost,
  }));
  archive.append(JSON.stringify(followersIndex, null, 2), {
    name: "followers.json",
  });

  // 1c. Add payment-relationships.json (Sovereign Audience & Payout Ledger Export)
  const PayoutLedgerEntry = require("../models/PayoutLedgerEntry");
  const writerPayouts = await PayoutLedgerEntry.find({ writer: user._id }).sort({ periodEnd: -1 });
  const totalEarnedPayoutCents = writerPayouts.reduce((sum, p) => sum + (p.payoutCents || 0), 0);

  const subscriberDirectory = follows.map((f) => {
    const follower = f.follower;
    if (!follower) {
      return {
        subscriberId: null,
        name: "Deleted User",
        email: "",
        membershipStatus: "none",
        isPlatformMember: false,
        razorpaySubscriptionId: null,
      };
    }

    return {
      subscriberId: String(follower._id),
      name: follower.name || "Anonymous Reader",
      email: follower.email || "",
      membershipStatus: follower.membershipStatus || "none",
      isPlatformMember: follower.membershipStatus === "active",
      razorpaySubscriptionId: follower.razorpaySubscriptionId || null,
    };
  });

  const exportPayload = {
    writerId: String(user._id),
    writerName: user.name,
    writerEmail: user.email,
    totalEarnedPayoutCents,
    payoutHistory: writerPayouts.map((p) => ({
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      payoutCents: p.payoutCents,
      readTimeSeconds: p.readTimeSeconds,
      status: p.status,
    })),
    subscribers: subscriberDirectory,
  };

  archive.append(JSON.stringify(exportPayload, null, 2), {
    name: "payment-relationships.json",
  });

  // 1d. Add PORTABILITY_DISCLOSURE.md
  const disclosureText = `# Sovereign Audience & Revenue Portability Disclosure

This export contains your complete sovereign audience directory (subscriber emails, follow dates, platform membership status) and official payout ledger history (\`payoutHistory\`).

### Revenue Model & Card Processor Boundaries
- **Pool-Based Revenue Model:** Inkwell operates on a platform-wide reader membership pool. Readers subscribe to Inkwell to access member content, and monthly payout pools are distributed to writers proportional to active read time.
- **Sovereign Audience Export:** You own your subscriber identity list and earned payout audit log (\`payment-relationships.json\`).
- **Card Processor Tokens:** Automated recurring billing tokens for platform memberships remain governed by Razorpay API security bounds. If migrating readers to a different platform or direct processor, readers will be prompted to subscribe on your new platform.
`;
  archive.append(disclosureText, {
    name: "PORTABILITY_DISCLOSURE.md",
  });

  // 2. Add posts-index.json
  const index = (posts || []).map((p) => ({
    title: p.title,
    subtitle: p.subtitle,
    slug: p.slug,
    status: p.status,
    tags: p.tags,
    createdAt: p.createdAt,
    publishedAt: p.publishedAt,
    views: p.views,
    totalClaps: p.totalClaps,
  }));
  archive.append(JSON.stringify(index, null, 2), {
    name: "posts-index.json",
  });

  // 3. Add each post's files
  (posts || []).forEach((post) => {
    const postJson = typeof post.toCardJSON === "function" ? post.toCardJSON() : { title: post.title, slug: post.slug };
    postJson.contentHtml = post.contentHtml;

    archive.append(JSON.stringify(postJson, null, 2), {
      name: `posts/${post.slug}.json`,
    });

    const md = turndown.turndown(post.contentHtml || "");
    archive.append(md, {
      name: `posts/${post.slug}.md`,
    });
  });

  await archive.finalize();
}

module.exports = { streamExport };
