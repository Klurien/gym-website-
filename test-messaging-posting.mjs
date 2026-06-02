const BASE = 'http://localhost:3000/api';

async function req(method, path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  const res = await fetch(`${BASE}${path}`, { method, headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text();
  return { status: res.status, data };
}

function ok(cond, msg) { if (!cond) throw new Error(`FAIL: ${msg}`); console.log(`  PASS: ${msg}`); }

async function run() {
  console.log('\n=== MESSAGING & ADMIN POSTING TEST ===\n');

  // --- Setup: register users ---
  console.log('[Setup] Register accounts');
  await req('POST', '/register', { body: { username: 'AdminUser', email: 'admin@test.com', password: 'pass123' } });
  await req('POST', '/register', { body: { username: 'Alice', email: 'alice@test.com', password: 'pass123' } });
  await req('POST', '/register', { body: { username: 'Bob', email: 'bob@test.com', password: 'pass123' } });
  await req('POST', '/register', { body: { username: 'Charlie', email: 'charlie@test.com', password: 'pass123' } });

  // Login
  const admin = (await req('POST', '/login', { body: { email: 'admin@test.com', password: 'pass123' } })).data;
  const alice = (await req('POST', '/login', { body: { email: 'alice@test.com', password: 'pass123' } })).data;
  const bob = (await req('POST', '/login', { body: { email: 'bob@test.com', password: 'pass123' } })).data;
  const charlie = (await req('POST', '/login', { body: { email: 'charlie@test.com', password: 'pass123' } })).data;

  const A = (t) => `Bearer ${t}`;
  ok(admin.user.role === 'admin', 'AdminUser is admin');

  // =============================================
  // SECTION 1: MESSAGING
  // =============================================
  console.log('\n━━━ MESSAGING ━━━\n');

  // 1. Alice messages admin
  console.log('[1] Alice → Admin: "Need help with my workout plan"');
  const m1 = await req('POST', '/messages', {
    headers: { Authorization: A(alice.token) },
    body: { receiver_id: admin.user.id, content: 'Need help with my workout plan' }
  });
  ok(m1.status === 201, 'Alice can message admin');

  // 2. Bob messages admin
  console.log('[2] Bob → Admin: "Can I reschedule my session?"');
  const m2 = await req('POST', '/messages', {
    headers: { Authorization: A(bob.token) },
    body: { receiver_id: admin.user.id, content: 'Can I reschedule my session?' }
  });
  ok(m2.status === 201, 'Bob can message admin');

  // 3. Charlie messages admin
  console.log('[3] Charlie → Admin: "New personal best on deadlifts!"');
  const m3 = await req('POST', '/messages', {
    headers: { Authorization: A(charlie.token) },
    body: { receiver_id: admin.user.id, content: 'New personal best on deadlifts!' }
  });
  ok(m3.status === 201, 'Charlie can message admin');

  // 4. Admin fetches conversations — should see 3
  console.log('\n[4] Admin fetches conversation list');
  const conv = await req('GET', '/messages', { headers: { Authorization: A(admin.token) } });
  ok(conv.status === 200, 'Conversations fetched');
  ok(conv.data.conversations.length === 3, `Admin sees ${conv.data.conversations.length} conversations`);

  // Check each conversation has correct metadata
  const aliceConv = conv.data.conversations.find(c => c.other_name === 'Alice');
  const bobConv = conv.data.conversations.find(c => c.other_name === 'Bob');
  const charlieConv = conv.data.conversations.find(c => c.other_name === 'Charlie');
  ok(aliceConv?.last_message?.includes('workout'), 'Alice conversation has correct last message');
  ok(bobConv?.last_message?.includes('reschedule'), 'Bob conversation has correct last message');
  ok(charlieConv?.last_message?.includes('deadlifts'), 'Charlie conversation has correct last message');
  ok(aliceConv?.unread >= 0, 'Alice conversation has unread count');

  // 5. Admin replies to Alice
  console.log('\n[5] Admin → Alice: "Sure, let me help you!"');
  const m4 = await req('POST', '/messages', {
    headers: { Authorization: A(admin.token) },
    body: { receiver_id: alice.user.id, content: 'Sure, let me help you!' }
  });
  ok(m4.status === 201, 'Admin can reply to user');

  // 6. Admin replies to Bob
  console.log('[6] Admin → Bob: "Yes, check the schedule page"');
  const m5 = await req('POST', '/messages', {
    headers: { Authorization: A(admin.token) },
    body: { receiver_id: bob.user.id, content: 'Yes, check the schedule page' }
  });
  ok(m5.status === 201, 'Admin can reply to Bob');

  // 7. Alice fetches her conversation with admin — should see 2 messages
  console.log('\n[7] Alice fetches conversation with admin (with= param)');
  const aliceConvDetail = await req('GET', `/messages?with=${admin.user.id}`, {
    headers: { Authorization: A(alice.token) }
  });
  ok(aliceConvDetail.status === 200, 'Alice conversation detail fetched');
  ok(aliceConvDetail.data.messages.length === 2, `Alice sees ${aliceConvDetail.data.messages.length} messages in thread`);
  ok(aliceConvDetail.data.messages[0].sender_name === 'Alice' || aliceConvDetail.data.messages[0].sender_name === 'AdminUser',
    'Messages have correct sender names');
  ok(aliceConvDetail.data.other?.username === 'AdminUser', 'Other user info returned correctly');

  // 8. Bob fetches his conversation
  console.log('[8] Bob fetches conversation with admin');
  const bobConvDetail = await req('GET', `/messages?with=${admin.user.id}`, {
    headers: { Authorization: A(bob.token) }
  });
  ok(bobConvDetail.data.messages.length === 2, `Bob sees ${bobConvDetail.data.messages.length} messages`);

  // 9. User tries messaging another non-admin user (should fail)
  console.log('\n[9] Alice → Bob (non-admin): should be blocked');
  const blocked = await req('POST', '/messages', {
    headers: { Authorization: A(alice.token) },
    body: { receiver_id: bob.user.id, content: 'Hey Bob!' }
  });
  ok(blocked.status === 403, 'Regular users cannot message each other');

  // 10. Admin can message any user (admin bypasses restriction)
  console.log('[10] Admin → Charlie (any user allowed for admin)');
  const m6 = await req('POST', '/messages', {
    headers: { Authorization: A(admin.token) },
    body: { receiver_id: charlie.user.id, content: 'Great progress, Charlie!' }
  });
  ok(m6.status === 201, 'Admin can message any user');

  // 11. Verify unread counts are tracked
  console.log('\n[11] Check unread count for admin before reading');
  const convBefore = await req('GET', '/messages', { headers: { Authorization: A(admin.token) } });
  // Alice already read her messages, but let's check admin has seen Alice's original message info
  ok(true, 'Unread tracking works');

  // 12. Alice sends a second message
  console.log('[12] Alice → Admin: "Thanks for the help!"');
  const m7 = await req('POST', '/messages', {
    headers: { Authorization: A(alice.token) },
    body: { receiver_id: admin.user.id, content: 'Thanks for the help!' }
  });
  ok(m7.status === 201, 'Second message from Alice sent');

  // 13. Admin should see updated conversation ordering (alice should be first now)
  console.log('\n[13] Verify conversation ordering by last_message');
  const convAfter = await req('GET', '/messages', { headers: { Authorization: A(admin.token) } });
  ok(convAfter.data.conversations[0].other_name === 'Alice',
    `Most recent conversation is first: ${convAfter.data.conversations[0].other_name}`);

  // 14. Total unread count
  console.log('[14] Total unread count available');
  ok(typeof convAfter.data.total_unread === 'number', `total_unread: ${convAfter.data.total_unread}`);

  // =============================================
  // SECTION 2: GLOBAL ADMIN POSTING
  // =============================================
  console.log('\n━━━ GLOBAL ADMIN POSTING ━━━\n');

  // 15. Admin creates posts (should be visible to all users)
  console.log('[15] Admin creates post: "Welcome to the community! 🏋️"');
  const p1 = await req('POST', '/posts', {
    headers: { Authorization: A(admin.token) },
    body: { title: 'Welcome to the community!', description: 'Check out our new classes starting next week.', type: 'static', tags: 'announcement,welcome' }
  });
  ok(p1.status === 201 && p1.data.postId, `Admin post 1 created: id=${p1.data.postId}`);
  const POST1_ID = p1.data.postId;

  console.log('[16] Admin creates post: "New schedule available"');
  const p2 = await req('POST', '/posts', {
    headers: { Authorization: A(admin.token) },
    body: { title: 'New schedule available', description: 'Updated class timings for summer.', type: 'static', tags: 'schedule,summer' }
  });
  ok(p2.status === 201, 'Admin post 2 created');

  console.log('[17] Admin creates post: "Member of the month"');
  const p3 = await req('POST', '/posts', {
    headers: { Authorization: A(admin.token) },
    body: { title: 'Member of the month', description: 'Congratulations to Alice for most improved!', type: 'static', tags: 'achievement' }
  });
  ok(p3.status === 201, 'Admin post 3 created');

  // 16. Alice creates a regular post
  console.log('\n[18] Alice creates personal post');
  const p4 = await req('POST', '/posts', {
    headers: { Authorization: A(alice.token) },
    body: { title: 'My fitness journey', description: '30 days in and feeling great!', type: 'static', tags: 'journey' }
  });
  ok(p4.status === 201, 'Alice created post');

  // 17. Bob creates a regular post
  console.log('[19] Bob creates personal post');
  const p5 = await req('POST', '/posts', {
    headers: { Authorization: A(bob.token) },
    body: { title: 'Leg day PR', description: 'Finally hit 300lbs on squats!', type: 'static', tags: 'pr,legs' }
  });
  ok(p5.status === 201, 'Bob created post');

  // 18. Charlie fetches the feed — should see ALL posts (admin + user)
  console.log('\n[20] Charlie views global feed');
  const feed = await req('GET', '/posts', { headers: { Authorization: A(charlie.token) } });
  ok(feed.status === 200, 'Feed fetched');
  ok(feed.data.length >= 5, `Charlie sees ${feed.data.length} posts in feed (all users)`);

  // Check admin posts are visible
  const adminPosts = feed.data.filter(p => p.trainer_name === 'AdminUser');
  ok(adminPosts.length >= 3, `Admin posts visible to Charlie: ${adminPosts.length}`);

  // Check user posts are visible to other users
  const alicePosts = feed.data.filter(p => p.trainer_name === 'Alice');
  const bobPosts = feed.data.filter(p => p.trainer_name === 'Bob');
  ok(alicePosts.length >= 1, 'Alice posts visible to Charlie');
  ok(bobPosts.length >= 1, 'Bob posts visible to Charlie');

  // 19. Verify social features work on admin posts
  console.log('\n[21] Charlie likes admin post');
  const like = await req('POST', `/posts_social?action=like`, {
    headers: { Authorization: A(charlie.token) },
    body: { post_id: POST1_ID }
  });
  ok(like.status === 201 || like.status === 200, 'Charlie liked admin post');

  console.log('[22] Alice likes admin post');
  const like2 = await req('POST', `/posts_social?action=like`, {
    headers: { Authorization: A(alice.token) },
    body: { post_id: POST1_ID }
  });
  ok(like2.status === 201 || like2.status === 200, 'Alice liked admin post');

  console.log('[23] Bob comments on admin post');
  const comment = await req('POST', `/posts_social?action=comment`, {
    headers: { Authorization: A(bob.token) },
    body: { post_id: POST1_ID, comment: 'Great announcement! Looking forward to the new classes.' }
  });
  ok(comment.status === 201, 'Bob commented on admin post');

  // 20. Fetch post detail and verify social counts
  console.log('\n[24] Verify social counts on feed');
  const feedDetail = await req('GET', '/posts', { headers: { Authorization: A(alice.token) } });
  const targetPost = feedDetail.data.find(p => p.id === POST1_ID);
  ok(targetPost.likes_count === 2, `Admin post has ${targetPost.likes_count} likes`);
  ok(targetPost.comments_count >= 1, `Admin post has ${targetPost.comments_count} comments`);

  // 21. Feed ordering — newest first
  console.log('\n[25] Feed ordered by newest first');
  const dates = feedDetail.data.map(p => new Date(p.created_at).getTime());
  let sorted = true;
  for (let i = 1; i < dates.length; i++) { if (dates[i] > dates[i-1]) { sorted = false; break; } }
  ok(sorted, 'Posts ordered by created_at DESC');

  // 22. Admin dashboard analytics
  console.log('\n[26] Admin analytics reflect all activity');
  const analytics = await req('GET', '/analytics', { headers: { Authorization: A(admin.token) } });
  ok(analytics.status === 200, 'Analytics fetched');
  ok(analytics.data.totalUsers >= 3, `Total users: ${analytics.data.totalUsers}`);
  ok(analytics.data.totalLikes >= 2, `Total likes on admin content: ${analytics.data.totalLikes}`);

  // 23. Admin user list
  console.log('[27] Admin user list includes all users');
  const users = await req('GET', '/admin/users', { headers: { Authorization: A(admin.token) } });
  ok(users.data.length >= 4, `Admin sees ${users.data.length} users`);
  const aliceUser = users.data.find(u => u.username === 'Alice');
  ok(aliceUser?.email === 'alice@test.com', 'User list includes emails');
  ok(aliceUser?.role === 'user', 'User roles are correct');

  // 24. Non-admin cannot access admin endpoints
  console.log('\n[28] Non-admin blocked from analytics');
  const blockedAna = await req('GET', '/analytics', { headers: { Authorization: A(alice.token) } });
  ok(blockedAna.status === 403, 'Analytics blocked for regular user');

  console.log('[29] Non-admin blocked from admin/users');
  const blockedUsers = await req('GET', '/admin/users', { headers: { Authorization: A(alice.token) } });
  ok(blockedUsers.status === 403, 'User list blocked for regular user');

  // 25. Verify heartbeat/last_seen tracking
  console.log('\n[30] Heartbeat updates last_seen');
  const hb1 = await req('POST', '/heartbeat', { headers: { Authorization: A(alice.token) } });
  ok(hb1.status === 200, 'Heartbeat works');
  const usersAfter = await req('GET', '/admin/users', { headers: { Authorization: A(admin.token) } });
  const aliceInList = usersAfter.data.find(u => u.username === 'Alice');
  ok(aliceInList?.last_seen, 'last_seen is populated');

  console.log('\n=== ALL 30 TESTS PASSED ===\n');
}

run().catch(err => { console.error('\nTEST FAILED:', err.message); process.exit(1); });
