# Blog extraction evidence

Frozen Ephemeris fixtures from landing-astro commit `1101bcfe8d656e5a082ae1cbce97966b888bfff4`.
Locations are one-based line:column pairs in each original fixture; end locations
are inclusive. Inline markup may lie inside a mapped span, but only extracted
prose contributes to character counts. Both representations have 38 segments
and 7,540 UTF-16 prose characters.

| Segment | Markdown start–end | HTML start–end | Characters | Prose preview |
|---:|---|---|---:|---|
| 1 | 11:1–11:179 | 1:4–1:182 | 179 | A credit balance tells you how much is left. It takes more c… |
| 2 | 13:1–13:224 | 2:4–2:227 | 224 | We built a tool that lets Ditto answer those questions from … |
| 3 | 15:1–15:295 | 3:4–3:311 | 291 | The system brings together three things: billing records, ti… |
| 4 | 17:4–17:40 | 4:48–4:84 | 37 | Ask about the work behind the credits… |
| 5 | 19:1–19:19 | 5:4–5:22 | 19 | Try questions like:… |
| 6 | 21:3–21:46 | 7:5–7:48 | 44 | “Where have my credits been going recently?”… |
| 7 | 22:3–22:94 | 8:5–8:96 | 92 | “At my current pace, how does my usage compare with the cred… |
| 8 | 23:3–23:76 | 9:5–9:78 | 74 | “Which plan fits if I keep my current resources and connect … |
| 9 | 25:1–25:312 | 11:4–11:315 | 312 | These questions need different answers. An activity overview… |
| 10 | 27:1–27:158 | 12:4–12:161 | 158 | The default reply stays at that level. Forecast ranges, mode… |
| 11 | 29:4–29:40 | 13:48–13:84 | 37 | Give the forecaster the right history… |
| 12 | 31:1–31:52 | 14:4–14:55 | 52 | Before predicting consumption, we have to define it.… |
| 13 | 33:1–33:258 | 15:4–15:261 | 258 | Buying credits is not consuming credits. A subscription fee … |
| 14 | 35:1–35:375 | 16:4–16:378 | 375 | Ditto builds its forecasting history from retained receipts … |
| 15 | 37:1–37:272 | 17:4–17:275 | 272 | Long histories stay in the analysis. We aggregate older obse… |
| 16 | 39:1–39:427 | 18:4–18:430 | 427 | Recent activity insights are measured separately from the da… |
| 17 | 41:4–41:40 | 19:47–19:83 | 37 | Why Ephemeris, and where Cascade fits… |
| 18 | 43:2–43:302 | 20:56–20:327 | 210 | Ephemeris provides probabilistic time-series forecasts throu… |
| 19 | 45:1–45:385 | 21:4–21:412 | 345 | Ditto's current integration requests Chronos-2 explicitly. W… |
| 20 | 47:2–47:380 | 22:55–22:394 | 336 | Cascade's open-source project explores another part of this … |
| 21 | 49:1–49:268 | 23:4–23:271 | 268 | These are distinct layers. Ditto uses Ephemeris to access Ch… |
| 22 | 51:4–51:35 | 24:43–24:74 | 32 | A forecast has to earn its place… |
| 23 | 53:1–53:319 | 25:4–25:333 | 268 | Good benchmark results do not establish accuracy on your par… |
| 24 | 55:1–55:334 | 26:4–26:337 | 334 | Ditto therefore compares the provider's predictions with a s… |
| 25 | 57:1–57:200 | 27:4–27:203 | 200 | This safeguard mattered in our early testing: the more sophi… |
| 26 | 59:1–59:313 | 28:4–28:316 | 313 | Forecast ranges are conditional scenarios, not guarantees. A… |
| 27 | 61:4–61:21 | 29:29–29:46 | 18 | Keep BYOK separate… |
| 28 | 63:1–63:166 | 30:4–30:169 | 166 | When you bring your own provider key, that provider bills th… |
| 29 | 65:1–65:270 | 31:4–31:286 | 266 | The tool reports BYOK activity separately and can estimate i… |
| 30 | 67:1–67:302 | 32:4–32:305 | 302 | For managed forecasting, Ditto sends numeric usage totals to… |
| 31 | 69:4–69:58 | 33:65–33:119 | 55 | Recommend a suitable plan, then leave the choice to you… |
| 32 | 71:1–71:210 | 34:4–34:224 | 198 | Consumption alone cannot decide between Pay as you go, Plus … |
| 33 | 73:1–73:350 | 35:4–35:353 | 350 | Ditto combines known requirements and current resource use w… |
| 34 | 75:1–75:205 | 36:4–36:208 | 205 | This tool gives advice. It does not change your subscription… |
| 35 | 77:1–77:306 | 37:4–37:309 | 306 | Ditto sponsors the forecasting requests under daily spending… |
| 36 | 79:4–79:29 | 38:37–38:62 | 26 | Try it in your own account… |
| 37 | 81:1–81:168 | 39:4–39:171 | 168 | Usage analysis is enabled across Ditto plans, with forecasts… |
| 38 | 83:1–83:318 | 40:4–40:332 | 286 | Start with a question about your own work: open Ditto and as… |

## Diagnostic locations

| Rule | Markdown | HTML | Original Markdown span |
|---|---|---|---|
| no-weasel-words | 11:168 | 1:171 | actually |
| no-stacked-adjectives | 25:129 | 11:132 | behind tracked credit |
| no-passive-voice | 35:119 | 16:122 | is estimated |
| no-stacked-adjectives | 37:165 | 17:168 | enough recorded consumption |
| no-passive-voice | 39:26 | 18:29 | are measured |
| no-passive-voice | 47:232 | 22:246 | is held |
| no-passive-voice | 47:287 | 22:301 | be compared. |
| no-stacked-adjectives | 49:141 | 23:144 | Cascade-trained checkpoint. |
| no-weak-modals | 53:249 | 25:263 | can make |
| no-stacked-adjectives | 55:60 | 26:63 | simple recent-pace |
| no-passive-voice | 59:291 | 28:294 | are guaranteed |
| no-stacked-adjectives | 65:206 | 31:222 | Ditto-funded usage |
| no-stacked-adjectives | 73:113 | 35:116 | expensive suitable plan. |
| no-stacked-adjectives | 77:41 | 37:44 | under daily spending |
| no-stacked-adjectives | 77:176 | 37:179 | uncertain paid request |
| no-passive-voice | 81:16 | 39:19 | is enabled |

## Landing-astro corpus extraction

Read-only extraction used Git objects at landing-astro commit `2fffa3c665065f2e70ecbcdbc9ea79fb660add6f`,
so concurrent consumer copy edits did not affect the inputs. Every listed file
completed extraction without errors. This checks adapter extraction and source
mapping availability; the corpus totals do not claim a clean lint or deployment.

| Adapter | Files | Segments | UTF-16 prose characters |
|---|---:|---:|---:|
| @faircopy/markdown | 124 | 8563 | 806385 |
| @faircopy/html | 78 | 6010 | 639103 |

### Exact inspected corpus files

| File | Segments | Characters |
|---|---:|---:|
| src/content/blog/agentic-ai-inside-your-chat-how-dittos-sub-agents-work.md | 59 | 6474 |
| src/content/blog/ai-for-coaches-and-consultants-how-persistent-memory-tracks-every-client.md | 54 | 9373 |
| src/content/blog/ai-for-content-creators-how-persistent-memory-keeps-your-brand-voice-consistent.md | 89 | 11631 |
| src/content/blog/ai-for-data-scientists-and-analysts-how-persistent-memory-tracks-every-experiment.md | 43 | 9605 |
| src/content/blog/ai-for-designers-how-persistent-memory-keeps-every-project-on-brand.md | 43 | 10324 |
| src/content/blog/ai-for-developers-how-persistent-memory-tracks-every-project.md | 69 | 10334 |
| src/content/blog/ai-for-entrepreneurs-how-persistent-memory-gives-startups-an-edge.md | 54 | 7334 |
| src/content/blog/ai-for-freelancers-how-persistent-memory-manages-every-client.md | 67 | 9727 |
| src/content/blog/ai-for-hr-professionals-and-recruiters-how-persistent-memory-tracks-every-candidate.md | 43 | 9200 |
| src/content/blog/ai-for-job-seekers-how-persistent-memory-streamlines-your-search.md | 75 | 10265 |
| src/content/blog/ai-for-lawyers-how-persistent-memory-tracks-every-case-client-and-precedent.md | 49 | 10683 |
| src/content/blog/ai-for-learning-how-persistent-memory-changes-studying.md | 48 | 6927 |
| src/content/blog/ai-for-marketers-how-persistent-memory-powers-every-campaign.md | 47 | 10526 |
| src/content/blog/ai-for-parents-how-persistent-memory-keeps-track-of-your-whole-family.md | 52 | 7492 |
| src/content/blog/ai-for-product-managers-how-persistent-memory-tracks-every-decision-roadmap-and-user-insight.md | 42 | 10446 |
| src/content/blog/ai-for-project-managers-how-persistent-memory-tracks-every-decision-deadline-and-dependency.md | 79 | 11238 |
| src/content/blog/ai-for-real-estate-agents-how-persistent-memory-tracks-every-listing-client-and-deal.md | 43 | 9386 |
| src/content/blog/ai-for-researchers-how-persistent-memory-transforms-academic-work.md | 63 | 9886 |
| src/content/blog/ai-for-sales-professionals-how-persistent-memory-closes-more-deals.md | 49 | 10490 |
| src/content/blog/ai-for-small-business-owners-how-persistent-memory-runs-your-operation.md | 64 | 9557 |
| src/content/blog/ai-for-students-how-persistent-memory-helps-you-ace-every-semester.md | 46 | 10090 |
| src/content/blog/ai-for-teachers-how-persistent-memory-remembers-every-student-lesson-and-breakthrough.md | 59 | 9947 |
| src/content/blog/ai-for-therapists-and-counselors-how-persistent-memory-supports-every-session.md | 47 | 10027 |
| src/content/blog/ai-for-writers-how-memory-transforms-creative-projects.md | 65 | 8907 |
| src/content/blog/ai-goal-tracking-ditto-keeps-goals-in-every-conversation.md | 52 | 6631 |
| src/content/blog/ai-journaling-ditto-remembers-every-conversation.md | 73 | 10162 |
| src/content/blog/ai-memory-compared-ditto-chatgpt-claude.md | 229 | 19829 |
| src/content/blog/ai-memory-systems.md | 37 | 2032 |
| src/content/blog/ai-personality-engine-how-ditto-adapts-to-you.md | 76 | 7717 |
| src/content/blog/beyond-text-how-ditto-remembers-images-documents-and-voice.md | 103 | 7217 |
| src/content/blog/build-your-ai-second-brain-with-ditto.md | 83 | 10163 |
| src/content/blog/code-splitting-in-solidjs-lazy-loading-done-right.md | 118 | 5661 |
| src/content/blog/composite-mlp-v2-how-ditto-ranks-memories-now.md | 172 | 13789 |
| src/content/blog/connect-ditto-to-any-ai-assistant-mcp-integration-guide.md | 179 | 7473 |
| src/content/blog/connect-google-workspace-to-ditto-gmail-calendar-drive.md | 67 | 6671 |
| src/content/blog/dead-code-cleanup-with-knip.md | 94 | 5483 |
| src/content/blog/ditto-code-your-ai-software-engineer.md | 144 | 8908 |
| src/content/blog/ditto-goes-native-your-ai-memory-on-ios-and-android.md | 34 | 4791 |
| src/content/blog/ditto-now-connects-to-third-party-mcp-servers.md | 66 | 5933 |
| src/content/blog/ditto-threads-ai-chat-that-never-goes-stale.md | 112 | 7681 |
| src/content/blog/dittobench-how-we-measure-dittos-agent.md | 285 | 19801 |
| src/content/blog/dittobench-v2-the-benchmark-that-rebuilds-itself.md | 147 | 19757 |
| src/content/blog/dreaming-pipeline-how-ditto-builds-your-knowledge-graph.md | 95 | 13385 |
| src/content/blog/every-chat-you-have-one-memory.md | 43 | 8575 |
| src/content/blog/finding-and-fixing-blocking-queries.md | 63 | 3967 |
| src/content/blog/from-bayes-to-your-agents-a-short-history-of-machine-learning.md | 78 | 10446 |
| src/content/blog/from-react-to-solidjs-a-migration-story.md | 115 | 6537 |
| src/content/blog/getting-started-with-ditto.md | 61 | 5844 |
| src/content/blog/how-dittos-ai-agents-use-your-memory.md | 74 | 6063 |
| src/content/blog/how-we-measured-solidjs-performance-gains.md | 83 | 5293 |
| src/content/blog/introducing-ditto.md | 14 | 1429 |
| src/content/blog/ios-pwa-gotchas-safe-areas-and-cameras.md | 72 | 4966 |
| src/content/blog/jev-auto-model-routing-and-mcp-memory.md | 37 | 7236 |
| src/content/blog/learned-retrieval-weights-how-ditto-picks-the-right-memories.md | 144 | 12881 |
| src/content/blog/offline-first-with-solid-query-and-indexeddb.md | 91 | 4902 |
| src/content/blog/open-sourcing-the-ditto-harness-and-dittobench-starter-kit.md | 58 | 7998 |
| src/content/blog/pick-the-right-ai-model-for-every-task.md | 102 | 8198 |
| src/content/blog/pre-computed-context-how-ditto-keeps-long-conversations-fast.md | 48 | 6047 |
| src/content/blog/productivity-tips-with-ai.md | 50 | 2853 |
| src/content/blog/put-your-ai-on-autopilot-automations-recipes-and-code-mode.md | 50 | 10048 |
| src/content/blog/reverse-engineering-chatgpt-scroll-behavior.md | 103 | 6492 |
| src/content/blog/save-and-organize-ai-conversations-bookmarks-collections.md | 84 | 7193 |
| src/content/blog/skeleton-loading-states-that-dont-suck.md | 95 | 5105 |
| src/content/blog/solidjs-anti-patterns-we-learned-the-hard-way.md | 133 | 6342 |
| src/content/blog/solidjs-three-weeks-later-what-we-learned.md | 100 | 6037 |
| src/content/blog/stop-re-explaining-your-tech-stack-to-ai.md | 65 | 8234 |
| src/content/blog/talk-to-your-ai-ditto-live-voice-mode.md | 48 | 6337 |
| src/content/blog/talk-to-your-ai-dittos-realtime-voice-mode.md | 45 | 5986 |
| src/content/blog/teaching-memory-to-find-itself.md | 101 | 11978 |
| src/content/blog/transparent-ai-memory-see-what-ditto-remembers.md | 62 | 8483 |
| src/content/blog/under-the-hood-making-ditto-50-percent-faster.md | 29 | 2427 |
| src/content/blog/use-every-ai-model-in-one-assistant.md | 71 | 6196 |
| src/content/blog/why-your-ai-forgets-everything-you-tell-it.md | 64 | 8791 |
| src/content/blog/why-your-ai-should-show-its-work.md | 91 | 7272 |
| src/content/blog/your-ai-assistant-now-works-with-google-workspace.md | 37 | 4252 |
| src/content/blog/your-ai-memory-your-rules-how-ditto-handles-privacy.md | 55 | 7142 |
| src/content/blog/your-personal-knowledge-graph-how-ditto-maps-your-thinking.md | 121 | 8606 |
| src/content/docs/account-deletion.md | 28 | 1752 |
| src/content/docs/account.md | 38 | 1523 |
| src/content/docs/agent-accounts.md | 39 | 3378 |
| src/content/docs/agent-integrations.md | 43 | 2220 |
| src/content/docs/agent-native-signup.md | 39 | 1725 |
| src/content/docs/ai-assistant-memory-workflow.md | 90 | 3888 |
| src/content/docs/app-permissions.md | 63 | 3052 |
| src/content/docs/apple-private-relay.md | 29 | 2794 |
| src/content/docs/attachments.md | 20 | 1145 |
| src/content/docs/bookmarks.md | 32 | 1297 |
| src/content/docs/building-apps-on-ditto.md | 52 | 4350 |
| src/content/docs/connected-apps.md | 37 | 2322 |
| src/content/docs/creating-workflows.md | 82 | 5460 |
| src/content/docs/cross-app-data-sharing.md | 13 | 1464 |
| src/content/docs/custom-instructions.md | 81 | 8121 |
| src/content/docs/dedicated-graphs.md | 76 | 6483 |
| src/content/docs/developer-quickstart.md | 41 | 2509 |
| src/content/docs/ditto-cli.md | 107 | 4316 |
| src/content/docs/editing-workflows.md | 47 | 3313 |
| src/content/docs/getting-started.md | 58 | 3237 |
| src/content/docs/hermes.md | 35 | 1473 |
| src/content/docs/image-generation.md | 55 | 3014 |
| src/content/docs/importing-skills.md | 57 | 3779 |
| src/content/docs/importing-your-memory.md | 143 | 8536 |
| src/content/docs/knowledge-graph-sharing.md | 44 | 2977 |
| src/content/docs/mcp-connections.md | 141 | 5156 |
| src/content/docs/mcp-server.md | 31 | 2326 |
| src/content/docs/memory-network.md | 47 | 2944 |
| src/content/docs/mining-getting-started.md | 54 | 4122 |
| src/content/docs/mining-on-ditto.md | 44 | 3578 |
| src/content/docs/mining-scoring.md | 53 | 5360 |
| src/content/docs/mining-submitting.md | 63 | 4343 |
| src/content/docs/model-switching.md | 101 | 5862 |
| src/content/docs/onboarding.md | 20 | 2892 |
| src/content/docs/openclaw.md | 31 | 1500 |
| src/content/docs/personality.md | 49 | 2798 |
| src/content/docs/settings.md | 82 | 4444 |
| src/content/docs/spaces.md | 11 | 1456 |
| src/content/docs/subscription.md | 13 | 1349 |
| src/content/docs/threads.md | 27 | 1766 |
| src/content/docs/v2-beta-testing.md | 47 | 6091 |
| src/content/docs/voice.md | 19 | 1261 |
| src/content/docs/web-search.md | 38 | 2167 |
| src/content/docs/workflow-questions.md | 81 | 4865 |
| src/content/docs/workflow-schedules-and-runs.md | 111 | 6959 |
| src/content/docs/workflows-in-chat.md | 64 | 3868 |
| src/content/docs/workflows.md | 85 | 4041 |
| src/site/data/resources/blog/agentic-ai-inside-your-chat-how-dittos-sub-agents-work.html | 58 | 6397 |
| src/site/data/resources/blog/ai-for-coaches-and-consultants-how-persistent-memory-tracks-every-client.html | 53 | 9268 |
| src/site/data/resources/blog/ai-for-content-creators-how-persistent-memory-keeps-your-brand-voice-consistent.html | 88 | 11531 |
| src/site/data/resources/blog/ai-for-data-scientists-and-analysts-how-persistent-memory-tracks-every-experiment.html | 42 | 9501 |
| src/site/data/resources/blog/ai-for-designers-how-persistent-memory-keeps-every-project-on-brand.html | 42 | 10254 |
| src/site/data/resources/blog/ai-for-developers-how-persistent-memory-tracks-every-project.html | 68 | 10242 |
| src/site/data/resources/blog/ai-for-entrepreneurs-how-persistent-memory-gives-startups-an-edge.html | 53 | 7252 |
| src/site/data/resources/blog/ai-for-freelancers-how-persistent-memory-manages-every-client.html | 66 | 9640 |
| src/site/data/resources/blog/ai-for-hr-professionals-and-recruiters-how-persistent-memory-tracks-every-candidate.html | 42 | 9089 |
| src/site/data/resources/blog/ai-for-job-seekers-how-persistent-memory-streamlines-your-search.html | 74 | 10186 |
| src/site/data/resources/blog/ai-for-lawyers-how-persistent-memory-tracks-every-case-client-and-precedent.html | 49 | 10597 |
| src/site/data/resources/blog/ai-for-learning-how-persistent-memory-changes-studying.html | 47 | 6866 |
| src/site/data/resources/blog/ai-for-marketers-how-persistent-memory-powers-every-campaign.html | 46 | 10442 |
| src/site/data/resources/blog/ai-for-parents-how-persistent-memory-keeps-track-of-your-whole-family.html | 51 | 7420 |
| src/site/data/resources/blog/ai-for-product-managers-how-persistent-memory-tracks-every-decision-roadmap-and-user-insight.html | 41 | 10351 |
| src/site/data/resources/blog/ai-for-project-managers-how-persistent-memory-tracks-every-decision-deadline-and-dependency.html | 78 | 11142 |
| src/site/data/resources/blog/ai-for-real-estate-agents-how-persistent-memory-tracks-every-listing-client-and-deal.html | 42 | 9299 |
| src/site/data/resources/blog/ai-for-researchers-how-persistent-memory-transforms-academic-work.html | 62 | 9789 |
| src/site/data/resources/blog/ai-for-sales-professionals-how-persistent-memory-closes-more-deals.html | 48 | 10423 |
| src/site/data/resources/blog/ai-for-small-business-owners-how-persistent-memory-runs-your-operation.html | 64 | 9470 |
| src/site/data/resources/blog/ai-for-students-how-persistent-memory-helps-you-ace-every-semester.html | 45 | 10021 |
| src/site/data/resources/blog/ai-for-teachers-how-persistent-memory-remembers-every-student-lesson-and-breakthrough.html | 58 | 9857 |
| src/site/data/resources/blog/ai-for-therapists-and-counselors-how-persistent-memory-supports-every-session.html | 46 | 9949 |
| src/site/data/resources/blog/ai-for-writers-how-memory-transforms-creative-projects.html | 64 | 8832 |
| src/site/data/resources/blog/ai-goal-tracking-ditto-keeps-goals-in-every-conversation.html | 51 | 6565 |
| src/site/data/resources/blog/ai-journaling-ditto-remembers-every-conversation.html | 72 | 10096 |
| src/site/data/resources/blog/ai-memory-compared-ditto-chatgpt-claude.html | 229 | 19721 |
| src/site/data/resources/blog/ai-memory-systems.html | 36 | 1728 |
| src/site/data/resources/blog/ai-personality-engine-how-ditto-adapts-to-you.html | 75 | 7657 |
| src/site/data/resources/blog/before-chatgpt-there-was-ditto.html | 72 | 7542 |
| src/site/data/resources/blog/beyond-text-how-ditto-remembers-images-documents-and-voice.html | 102 | 7145 |
| src/site/data/resources/blog/build-your-ai-second-brain-with-ditto.html | 82 | 10086 |
| src/site/data/resources/blog/code-splitting-in-solidjs-lazy-loading-done-right.html | 117 | 5611 |
| src/site/data/resources/blog/composite-mlp-v2-how-ditto-ranks-memories-now.html | 171 | 13739 |
| src/site/data/resources/blog/connect-ditto-to-any-ai-assistant-mcp-integration-guide.html | 178 | 7441 |
| src/site/data/resources/blog/connect-google-workspace-to-ditto-gmail-calendar-drive.html | 66 | 6599 |
| src/site/data/resources/blog/dead-code-cleanup-with-knip.html | 93 | 5456 |
| src/site/data/resources/blog/ditto-code-your-ai-software-engineer.html | 142 | 8538 |
| src/site/data/resources/blog/ditto-goes-native-your-ai-memory-on-ios-and-android.html | 33 | 4739 |
| src/site/data/resources/blog/ditto-now-connects-to-third-party-mcp-servers.html | 65 | 5888 |
| src/site/data/resources/blog/ditto-threads-ai-chat-that-never-goes-stale.html | 111 | 7631 |
| src/site/data/resources/blog/dittobench-how-we-measure-dittos-agent.html | 284 | 18598 |
| src/site/data/resources/blog/dittobench-v2-the-benchmark-that-rebuilds-itself.html | 150 | 19593 |
| src/site/data/resources/blog/dreaming-pipeline-how-ditto-builds-your-knowledge-graph.html | 94 | 13338 |
| src/site/data/resources/blog/every-chat-you-have-one-memory.html | 42 | 8514 |
| src/site/data/resources/blog/finding-and-fixing-blocking-queries.html | 62 | 3932 |
| src/site/data/resources/blog/from-bayes-to-your-agents-a-short-history-of-machine-learning.html | 77 | 9666 |
| src/site/data/resources/blog/from-react-to-solidjs-a-migration-story.html | 114 | 6497 |
| src/site/data/resources/blog/getting-started-with-ditto.html | 63 | 5588 |
| src/site/data/resources/blog/how-dittos-ai-agents-use-your-memory.html | 73 | 5995 |
| src/site/data/resources/blog/how-we-measured-solidjs-performance-gains.html | 82 | 5248 |
| src/site/data/resources/blog/introducing-ditto.html | 13 | 1158 |
| src/site/data/resources/blog/ios-pwa-gotchas-safe-areas-and-cameras.html | 72 | 4966 |
| src/site/data/resources/blog/jev-auto-model-routing-and-mcp-memory.html | 37 | 7236 |
| src/site/data/resources/blog/learned-retrieval-weights-how-ditto-picks-the-right-memories.html | 152 | 11152 |
| src/site/data/resources/blog/offline-first-with-solid-query-and-indexeddb.html | 90 | 4858 |
| src/site/data/resources/blog/open-sourcing-the-ditto-harness-and-dittobench-starter-kit.html | 57 | 7803 |
| src/site/data/resources/blog/pick-the-right-ai-model-for-every-task.html | 101 | 8160 |
| src/site/data/resources/blog/pre-computed-context-how-ditto-keeps-long-conversations-fast.html | 47 | 5973 |
| src/site/data/resources/blog/productivity-tips-with-ai.html | 49 | 2818 |
| src/site/data/resources/blog/put-your-ai-on-autopilot-automations-recipes-and-code-mode.html | 49 | 9987 |
| src/site/data/resources/blog/reverse-engineering-chatgpt-scroll-behavior.html | 102 | 6447 |
| src/site/data/resources/blog/save-and-organize-ai-conversations-bookmarks-collections.html | 83 | 7104 |
| src/site/data/resources/blog/skeleton-loading-states-that-dont-suck.html | 94 | 5066 |
| src/site/data/resources/blog/solidjs-anti-patterns-we-learned-the-hard-way.html | 132 | 6297 |
| src/site/data/resources/blog/solidjs-three-weeks-later-what-we-learned.html | 99 | 5994 |
| src/site/data/resources/blog/stop-re-explaining-your-tech-stack-to-ai.html | 63 | 7571 |
| src/site/data/resources/blog/talk-to-your-ai-ditto-live-voice-mode.html | 47 | 6258 |
| src/site/data/resources/blog/talk-to-your-ai-dittos-realtime-voice-mode.html | 44 | 5942 |
| src/site/data/resources/blog/teaching-memory-to-find-itself.html | 94 | 11150 |
| src/site/data/resources/blog/transparent-ai-memory-see-what-ditto-remembers.html | 61 | 8408 |
| src/site/data/resources/blog/under-the-hood-making-ditto-50-percent-faster.html | 28 | 2386 |
| src/site/data/resources/blog/use-every-ai-model-in-one-assistant.html | 70 | 5657 |
| src/site/data/resources/blog/why-your-ai-forgets-everything-you-tell-it.html | 63 | 8719 |
| src/site/data/resources/blog/why-your-ai-should-show-its-work.html | 90 | 7204 |
| src/site/data/resources/blog/your-ai-assistant-now-works-with-google-workspace.html | 36 | 4203 |
| src/site/data/resources/blog/your-ai-memory-your-rules-how-ditto-handles-privacy.html | 54 | 7070 |
| src/site/data/resources/blog/your-personal-knowledge-graph-how-ditto-maps-your-thinking.html | 120 | 8547 |

The `.mdx` source is intentionally outside the Markdown adapter. Its served
HTML is included above. Frontmatter and metadata JSON are outside these counts.
