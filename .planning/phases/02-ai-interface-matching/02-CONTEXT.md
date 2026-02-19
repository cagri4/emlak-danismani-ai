# Phase 2: AI Interface & Matching - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Users interact with the system using natural Turkish language through a chat interface. They can add properties and customers via conversation, search with natural queries, update statuses conversationally, and get AI-powered property-customer matches with scores and explanations. Voice commands and photo upload processing are in later phases, but basic voice input and file attachments are included here for the chat interface.

</domain>

<decisions>
## Implementation Decisions

### Chat Interface Design
- Floating button + modal design (WhatsApp-style bubble that opens chat overlay)
- Fixed medium size (~400px wide)
- Always visible on every page, modal stays open while navigating
- Persistent conversation history, all past conversations visible and scrollable
- Chat bubbles style — user on right (colored), AI on left (gray)
- Inline property/customer cards embedded in chat flow, clickable to detail
- Progress text while AI processing ("Analyzing request..." "Finding properties...")
- Voice input button (microphone icon, tap to speak, auto-transcribes)
- File attachments supported (photos, documents)
- Suggestion chips above input ("Mülk ekle" "İlan yaz" "Müşteri ara")

### Command Parsing Behavior
- Always confirm before creating/modifying data (show parsed data, ask "Create this property?")
- Ask for clarification on ambiguous input ("Hangi daireyi?")
- When AI can't understand: explain and suggest alternatives ("Anlayamadım. Şunları deneyebilirsiniz...")
- Support multi-step guided flows — AI asks follow-up questions step by step

### Customer Management Flow
- Minimum data to add customer: just name (other details added later)
- AI guides through preferences immediately after adding ("Hangi bölge? Bütçesi? Ne arıyor?")
- Conversational note capture ("Mehmet için not: acil arıyor" → AI parses and saves)
- Chat interactions logged to customer timeline automatically

### Matching Presentation
- Ranked list with scores ("1. Villa Bodrum (92%) 2. Daire Ankara (78%)")
- Natural language match explanation ("Bütçesine ve konumuna uyuyor, ama 2+1 istiyor bu 1+1")
- Show top 5 matches by default
- Both share and view buttons on each match result
- Bidirectional matching (find properties for customer AND find customers for property)
- When no matches: explain why and suggest actions ("Bu fiyat aralığında arayan müşteri yok. Fiyat düşürsen daha çok eşleşir.")
- Track match outcomes (was property shown, did customer like it)
- Smart scoring that learns from history (lower score if customer rejected similar before)

### Claude's Discretion
- Cancel button implementation for in-progress responses
- Suggestion chip behavior (fixed vs context-aware)

</decisions>

<specifics>
## Specific Ideas

- Chat should feel like messaging a helpful assistant, not using a command interface
- Turkish language throughout — all prompts, errors, suggestions in Turkish
- Progress messages should be informative: "İstanbul'da villa arıyorum..." not just "Loading..."
- Match explanations should read like a real estate agent talking: conversational, not bullet points

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-ai-interface-matching*
*Context gathered: 2026-02-19*
