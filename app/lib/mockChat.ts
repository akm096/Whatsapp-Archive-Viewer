// ────────────────────────────────────────────────────────────
// Mock data generator for development testing
// ────────────────────────────────────────────────────────────
import { ChatMessage, ChatArchive } from "./types";

const MOCK_SENDERS = ["Alice", "Bob", "Charlie"];
const LOREM_PHRASES = [
    "Hey, how are you?",
    "I'm good, thanks! What about you?",
    "Did you see that new movie?",
    "Yeah it was amazing! 🎬",
    "Let's meet up this weekend",
    "Sure, what time works for you?",
    "How about 3 PM?",
    "Sounds good! See you then 👋",
    "Can you send me that document?",
    "Sure, here it is",
    "Thanks! 🙏",
    "No problem",
    "What do you think about the project?",
    "I think we're on the right track",
    "We need to work on the UI more",
    "Agreed, let's schedule a call",
    "Did you finish the report?",
    "Almost done, just need to add charts",
    "Great, send it when ready",
    "Will do! 📊",
    "Happy birthday! 🎂🎉",
    "Thank you so much!",
    "LOL that's hilarious 😂",
    "Can't believe it!",
    "Check out this link",
    "This is a really long message that demonstrates how multi-line messages look in the chat viewer. It spans multiple lines and contains various types of content including emojis 🎉 and mentions of different topics.",
    "omw",
    "be there in 5",
    "Ok",
    "👍",
];

const SYSTEM_MESSAGES = [
    "Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.",
    "Alice changed the group description",
    "Bob was added",
];

/**
 * Generate a mock chat archive with N messages for dev testing.
 */
export function generateMockChat(messageCount: number = 200): ChatArchive {
    const messages: ChatMessage[] = [];
    const startDate = new Date(2024, 0, 1, 9, 0, 0);
    let currentDate = new Date(startDate);

    // Add initial system message
    messages.push({
        id: "0",
        datetime: currentDate.getTime(),
        dateKey: formatDateKeyMock(currentDate),
        sender: null,
        direction: "unknown",
        kind: "system",
        text: SYSTEM_MESSAGES[0],
        raw: SYSTEM_MESSAGES[0],
    });

    for (let i = 1; i < messageCount; i++) {
        // Advance time by 1-30 minutes
        currentDate = new Date(
            currentDate.getTime() + (1 + Math.random() * 29) * 60 * 1000
        );

        // Occasionally jump to next day
        if (Math.random() < 0.05) {
            currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        }

        // Occasionally insert system message
        if (Math.random() < 0.02 && i > 5) {
            messages.push({
                id: String(i),
                datetime: currentDate.getTime(),
                dateKey: formatDateKeyMock(currentDate),
                sender: null,
                direction: "unknown",
                kind: "system",
                text: SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)],
                raw: "",
            });
            continue;
        }

        // Occasionally insert attachment message
        if (Math.random() < 0.1) {
            const attachTypes = [
                { filename: `IMG-${20240101 + i}-WA${String(i).padStart(4, "0")}.jpg`, mime: "image/jpeg" },
                { filename: `VID-${20240101 + i}-WA${String(i).padStart(4, "0")}.mp4`, mime: "video/mp4" },
                { filename: `AUD-${20240101 + i}-WA${String(i).padStart(4, "0")}.opus`, mime: "audio/opus" },
                { filename: `DOC-${20240101 + i}-WA${String(i).padStart(4, "0")}.pdf`, mime: "application/pdf" },
            ];
            const att = attachTypes[Math.floor(Math.random() * attachTypes.length)];
            const sender = MOCK_SENDERS[Math.floor(Math.random() * MOCK_SENDERS.length)];
            messages.push({
                id: String(i),
                datetime: currentDate.getTime(),
                dateKey: formatDateKeyMock(currentDate),
                sender,
                direction: sender === "Alice" ? "out" : "in",
                kind: "attachment",
                text: `<attached: ${att.filename}>`,
                attachment: {
                    filename: att.filename,
                    mime: att.mime,
                    missing: true,
                },
                raw: "",
            });
            continue;
        }

        const sender =
            MOCK_SENDERS[Math.floor(Math.random() * MOCK_SENDERS.length)];
        const text =
            LOREM_PHRASES[Math.floor(Math.random() * LOREM_PHRASES.length)];

        messages.push({
            id: String(i),
            datetime: currentDate.getTime(),
            dateKey: formatDateKeyMock(currentDate),
            sender,
            direction: sender === "Alice" ? "out" : "in",
            kind: "text",
            text,
            raw: "",
        });
    }

    const participants = [...new Set(messages.map((m) => m.sender).filter(Boolean))] as string[];

    return {
        chatId: "mock-chat",
        title: "Mock Group Chat",
        participants,
        messages,
        stats: {
            totalMessages: messages.length,
            participants,
            firstDate: messages[0]?.dateKey || null,
            lastDate: messages[messages.length - 1]?.dateKey || null,
            mediaCount: messages.filter((m) => m.kind === "attachment").length,
        },
    };
}

function formatDateKeyMock(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
