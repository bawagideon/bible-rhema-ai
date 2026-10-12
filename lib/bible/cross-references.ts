/**
 * BIBLE RHEMA AI - SCRIPTURE CROSS-REFERENCE REPOSITORY
 * Treasury of verified biblical cross-references with canonical citations,
 * theological thematic connections, and Christocentric links.
 * "Scripture first. Always."
 */

export interface VerifiedCrossReference {
    reference: string;
    text: string;
    connection: string;
}

export const CANONICAL_CROSS_REFERENCES: Record<string, VerifiedCrossReference[]> = {
    john: [
        {
            reference: "1 John 1:1-2",
            text: "That which was from the beginning, which we have heard, which we have seen with our eyes, which we looked upon and have touched with our hands, concerning the word of life...",
            connection: "Johannine theology of the eternal Logos made manifest in human flesh."
        },
        {
            reference: "Colossians 1:15-17",
            text: "He is the image of the invisible God, the firstborn of all creation. For by him all things were created, in heaven and on earth, visible and invisible...",
            connection: "Pauline christology establishing Christ as the preeminent agent and sustainer of creation."
        },
        {
            reference: "Hebrews 1:1-3",
            text: "Long ago, at many times and in many ways, God spoke to our fathers by the prophets, but in these last days he has spoken to us by his Son...",
            connection: "Christ as the definitive, ultimate culmination of divine revelation."
        }
    ],
    romans: [
        {
            reference: "Genesis 50:20",
            text: "As for you, you meant evil against me, but God meant it for good, to bring it about that many people should be kept alive, as they are today.",
            connection: "Covenant archetype of divine providence orchestrating redemption through suffering."
        },
        {
            reference: "2 Corinthians 4:17-18",
            text: "For this light momentary affliction is preparing for us an eternal weight of glory beyond all comparison, as we look not to the things that are seen but to the things that are unseen.",
            connection: "Kingdom perspective comparing temporal trials to eternal resurrection weight."
        },
        {
            reference: "Isaiah 53:5",
            text: "But he was pierced for our transgressions; he was crushed for our iniquities; upon him was the chastisement that brought us peace, and with his wounds we are healed.",
            connection: "Messianic substitutionary atonement grounding our justification by faith."
        }
    ],
    psalms: [
        {
            reference: "John 10:11",
            text: "I am the good shepherd. The good shepherd lays down his life for the sheep.",
            connection: "Christ's self-identification fulfilling the shepherd imagery of Psalm 23."
        },
        {
            reference: "Philippians 4:6-7",
            text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.",
            connection: "New Testament pastoral application of casting all anxieties upon God."
        },
        {
            reference: "1 Peter 5:7",
            text: "Casting all your anxieties on him, because he cares for you.",
            connection: "Apostolic exhortation resting in the Shepherd's covenant oversight."
        }
    ],
    matthew: [
        {
            reference: "Jeremiah 6:16",
            text: "Thus says the LORD: 'Stand by the roads, and look, and ask for the ancient paths, where the good way is; and walk in it, and find rest for your souls.'",
            connection: "Old Testament prophetic promise of soul rest fulfilled in Christ's gentle yoke."
        },
        {
            reference: "Hebrews 4:9-11",
            text: "So then, there remains a Sabbath rest for the people of God, for whoever has entered God's rest has also rested from his works as God did from his.",
            connection: "Theological theology of Sabbath rest entered through faith in Christ."
        }
    ],
    general: [
        {
            reference: "Psalm 119:105",
            text: "Your word is a lamp to my feet and a light to my path.",
            connection: "Divine illumination and moral guidance through the written canonical Scriptures."
        },
        {
            reference: "Hebrews 4:12",
            text: "For the word of God is living and active, sharper than any two-edged sword, piercing to the division of soul and of spirit, of joints and of marrow...",
            connection: "The living discerning power of God's Word penetrating the human heart."
        },
        {
            reference: "Isaiah 55:10-11",
            text: "For as the rain and the snow come down from heaven and do not return there but water the earth... so shall my word be that goes out from my mouth; it shall not return to me empty...",
            connection: "The sovereign, unfailing effectiveness of God's proclaimed Word."
        }
    ]
};

/**
 * Resolves verified cross-references based on a passage focus or query
 */
export function getVerifiedCrossReferences(passage: string, query: string = ""): VerifiedCrossReference[] {
    const combined = `${passage} ${query}`.toLowerCase();

    if (combined.includes("john")) {
        return CANONICAL_CROSS_REFERENCES.john;
    } else if (combined.includes("roman")) {
        return CANONICAL_CROSS_REFERENCES.romans;
    } else if (combined.includes("psalm")) {
        return CANONICAL_CROSS_REFERENCES.psalms;
    } else if (combined.includes("matthew")) {
        return CANONICAL_CROSS_REFERENCES.matthew;
    }

    return CANONICAL_CROSS_REFERENCES.general;
}
