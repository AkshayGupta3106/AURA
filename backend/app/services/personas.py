"""
The 5 synthetic audience personas for the AURA virality simulator.
These represent Bangalore/Mumbai demographics across age, lifestyle, and content behavior.
"""

PERSONAS: list[dict] = [
    {
        "name": "Priya",
        "age": 24,
        "occupation": "working professional",
        "location": "Koramangala / Bandra",
        "behavior": "scrolls fast, price-aware, shares rarely",
        "full_profile": (
            "Priya is 24, a software product manager in Koramangala. "
            "She scrolls Instagram aggressively and will stop only if the first 3 seconds hook her. "
            "She is very price-conscious and immediately looks for pricing cues. "
            "She almost never shares content unless it directly solves a problem she has right now. "
            "She saves posts she wants to return to but forgets about them. "
            "She will comment only if she has a specific question about price or location."
        ),
    },
    {
        "name": "Ananya",
        "age": 31,
        "occupation": "new mom on maternity leave",
        "location": "Juhu / Whitefield",
        "behavior": "trusts recommendations, forwards to WhatsApp groups",
        "full_profile": (
            "Ananya is 31, recently returned from maternity leave and living in Whitefield. "
            "She trusts content that feels genuine and relatable — not overly produced. "
            "She watches most of a video if it seems trustworthy. "
            "She forwards content to her 3 WhatsApp groups regularly, especially 'recommendations'. "
            "She is willing to pay a premium for quality. "
            "She will comment something warm and encouraging if she likes what she sees."
        ),
    },
    {
        "name": "Riya",
        "age": 19,
        "occupation": "college student",
        "location": "Indiranagar / Powai",
        "behavior": "trend-follower, heavy sharer, low attention span",
        "full_profile": (
            "Riya is 19, a fashion-obsessed design student in Indiranagar. "
            "She has an extremely low attention span — if the video doesn't grab her in 2–3 seconds she's gone. "
            "She follows every trending hairstyle on Instagram and Pinterest. "
            "She shares anything that looks cool to her close friends story. "
            "She almost always comments — usually a short reaction like 'omg' or 'need this'. "
            "She doesn't think about price at all, just vibes."
        ),
    },
    {
        "name": "Meera",
        "age": 28,
        "occupation": "beauty enthusiast and content creator",
        "location": "HSR Layout / Versova",
        "behavior": "leaves detailed comments, saves everything, high engagement",
        "full_profile": (
            "Meera is 28, a part-time beauty blogger from HSR Layout. "
            "She watches salon content with a critical, expert eye. "
            "She finishes almost every beauty video she starts. "
            "She leaves detailed, thoughtful comments about technique, products used, or results. "
            "She saves virtually everything to her collections. "
            "She shares content that she thinks will grow her own following or add credibility to her page."
        ),
    },
    {
        "name": "Divya",
        "age": 42,
        "occupation": "homemaker and community organizer",
        "location": "Jayanagar / Dadar",
        "behavior": "occasional scroller, shares via WhatsApp only, skeptical of trends",
        "full_profile": (
            "Divya is 42, a homemaker in Jayanagar who manages a large joint family. "
            "She opens Instagram rarely and mostly to see what her kids are interested in. "
            "She is skeptical of trendy beauty content but will stop if it looks practical and relatable to her age group. "
            "She never shares on Instagram but will forward to family WhatsApp groups if the content seems useful or impressive. "
            "She watches content slowly and will reach out to the salon directly if genuinely interested. "
            "Her comments, when she leaves them, are usually practical questions."
        ),
    },
]
