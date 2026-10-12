/**
 * BIBLE RHEMA AI - COMPREHENSIVE TOPICAL CONCORDANCE & SCRIPTURE CORPUS
 * Expansive biblical knowledge base indexing major theological loci, covenant doctrines,
 * spiritual formation themes, and pastoral needs to exact canonical texts.
 * "Scripture first. Always."
 */

export interface ConcordancePassage {
    reference: string;
    text: string;
    translation: string;
    theme: string;
}

export interface TopicalConcordanceEntry {
    id: string;
    topic: string;
    keywords: string[];
    theologicalSummary: string;
    primaryPassage: ConcordancePassage;
    supportingPassages: ConcordancePassage[];
    strongsTermKeys: string[];
    crossReferences: { reference: string; text: string; connection: string }[];
}

export const TOPICAL_CONCORDANCE: Record<string, TopicalConcordanceEntry> = {
    // 1. JUSTIFICATION & GRACE
    justification: {
        id: "justification",
        topic: "Justification by Faith Alone",
        keywords: ["justification", "justified", "righteousness", "imputed", "faith", "works", "law", "grace", "salvation", "merit", "legal standing"],
        theologicalSummary: "The legal declaration of God where ungodly sinners are declared righteous solely on the basis of the imputed righteousness of Jesus Christ received through faith alone, apart from works.",
        primaryPassage: {
            reference: "Romans 3:23-26",
            text: "For all have sinned and fall short of the glory of God, and are justified by his grace as a gift, through the redemption that is in Christ Jesus, whom God put forward as a propitiation by his blood, to be received by faith. This was to show God's righteousness, because in his divine forbearance he had passed over former sins. It was to show his righteousness at the present time, so that he might be just and the justifier of the one who has faith in Jesus.",
            translation: "ESV",
            theme: "Divine Propitiation & Justification"
        },
        supportingPassages: [
            {
                reference: "Romans 5:1-2",
                text: "Therefore, since we have been justified by faith, we have peace with God through our Lord Jesus Christ. Through him we have also obtained access by faith into this grace in which we stand, and we rejoice in hope of the glory of God.",
                translation: "ESV",
                theme: "Peace Resulting from Justification"
            },
            {
                reference: "Galatians 2:16",
                text: "Yet we know that a person is not justified by works of the law but through faith in Jesus Christ, so we also have believed in Christ Jesus, in order to be justified by faith in Christ and not by works of the law, because by works of the law no one will be justified.",
                translation: "ESV",
                theme: "Exclusivity of Faith over Works of Law"
            },
            {
                reference: "Philippians 3:8-9",
                text: "Indeed, I count everything as loss because of the surpassing worth of knowing Christ Jesus my Lord... and be found in him, not having a righteousness of my own that comes from the law, but that which comes through faith in Christ, the righteousness from God that depends on faith.",
                translation: "ESV",
                theme: "Alien Righteousness of Christ"
            }
        ],
        strongsTermKeys: ["dikaiosune", "charis", "pistis"],
        crossReferences: [
            {
                reference: "Genesis 15:6",
                text: "And he believed the Lord, and he counted it to him as righteousness.",
                connection: "Abrahamic covenant archetype of faith counted as righteousness."
            },
            {
                reference: "2 Corinthians 5:21",
                text: "For our sake he made him to be sin who knew no sin, so that in him we might become the righteousness of God.",
                connection: "The Great Exchange: imputation of our sin to Christ and His righteousness to us."
            }
        ]
    },

    // 2. ANXIETY, PEACE & REST
    anxiety_peace: {
        id: "anxiety_peace",
        topic: "Peace Overcoming Anxiety & Rest in God",
        keywords: ["anxiety", "anxious", "fear", "peace", "rest", "worry", "stress", "calm", "stillness", "overwhelmed", "troubled", "panic"],
        theologicalSummary: "The transcendent shalom and tranquil soul-rest granted by Christ to believers, dispelling worldly anxiety through prayer, supplication, and steadfast reliance upon God's sovereign care.",
        primaryPassage: {
            reference: "Philippians 4:6-7",
            text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
            translation: "ESV",
            theme: "The Peace of God Guarding the Soul"
        },
        supportingPassages: [
            {
                reference: "Matthew 11:28-30",
                text: "Come to me, all who labor and are heavy laden, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls. For my yoke is easy, and my burden is light.",
                translation: "ESV",
                theme: "Christ's Invitation to Soul Rest"
            },
            {
                reference: "Isaiah 26:3",
                text: "You keep him in perfect peace whose mind is stayed on you, because he trusts in you.",
                translation: "ESV",
                theme: "Perfect Peace for Steadfast Trust"
            },
            {
                reference: "1 Peter 5:6-7",
                text: "Humble yourselves, therefore, under the mighty hand of God so that at the proper time he may exalt you, casting all your anxieties on him, because he cares for you.",
                translation: "ESV",
                theme: "Casting Anxieties Upon the Caring Father"
            },
            {
                reference: "John 14:27",
                text: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.",
                translation: "ESV",
                theme: "Christ's Bequeathed Shalom"
            }
        ],
        strongsTermKeys: ["shalom", "eirene"],
        crossReferences: [
            {
                reference: "Psalm 46:10",
                text: "Be still, and know that I am God. I will be exalted among the nations, I will be exalted in the earth!",
                connection: "Ceasing strivings in the assurance of God's exalted sovereignty."
            },
            {
                reference: "Psalm 23:1-3",
                text: "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.",
                connection: "Pastoral care of the Shepherd restoring the troubled soul."
            }
        ]
    },

    // 3. COVENANT & STEADFAST LOVE (HESED)
    covenant_love: {
        id: "covenant_love",
        topic: "Covenant Faithfulness & Steadfast Love (Hesed)",
        keywords: ["covenant", "hesed", "steadfast love", "lovingkindness", "mercy", "unconditional", "promise", "faithful", "oath", "everlasting"],
        theologicalSummary: "The unbreakable, loyal covenant love of Yahweh (Hesed) which endures forever, sealed by divine oath and fulfilled in the New Covenant in Christ's blood.",
        primaryPassage: {
            reference: "Jeremiah 31:31-34",
            text: "Behold, the days are coming, declares the Lord, when I will make a new covenant with the house of Israel and the house of Judah... I will put my law within them, and I will write it on their hearts. And I will be their God, and they shall be my people... For I will forgive their iniquity, and I will remember their sin no more.",
            translation: "ESV",
            theme: "The Promise of the New Covenant"
        },
        supportingPassages: [
            {
                reference: "Psalm 103:8-12",
                text: "The Lord is merciful and gracious, slow to anger and abounding in steadfast love. He will not always chide, nor will he keep his anger forever. He does not deal with us according to our sins, nor repay us according to our iniquities. For as high as the heavens are above the earth, so great is his steadfast love toward those who fear him; as far as the east is from the west, so far does he remove our transgressions from us.",
                translation: "ESV",
                theme: "Abounding Steadfast Love and Full Pardon"
            },
            {
                reference: "Romans 8:38-39",
                text: "For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers, nor height nor depth, nor anything else in all creation, will be able to separate us from the love of God in Christ Jesus our Lord.",
                translation: "ESV",
                theme: "Inseparable Covenant Love in Christ"
            },
            {
                reference: "Lamentations 3:22-23",
                text: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.",
                translation: "ESV",
                theme: "Morning Mercies of Hesed"
            }
        ],
        strongsTermKeys: ["hesed", "berith", "agape"],
        crossReferences: [
            {
                reference: "Hebrews 8:6",
                text: "But as it is, Christ has obtained a ministry that is as much more excellent than the old as the covenant he mediates is better, since it is enacted on better promises.",
                connection: "Christ as the mediator of a superior, unbreakable covenant."
            }
        ]
    },

    // 4. DEITY & SUPREMACY OF CHRIST
    deity_of_christ: {
        id: "deity_of_christ",
        topic: "The Deity & Cosmic Preeminence of Jesus Christ",
        keywords: ["deity", "christ", "jesus", "divinity", "god", "son of god", "incarnation", "preeminence", "creator", "lord", "messiah"],
        theologicalSummary: "The orthodox biblical confession that Jesus Christ is truly God and truly man, the eternal Logos who created and sustains all things, possessing absolute supremacy over all creation.",
        primaryPassage: {
            reference: "Colossians 1:15-19",
            text: "He is the image of the invisible God, the firstborn of all creation. For by him all things were created, in heaven and on earth, visible and invisible, whether thrones or dominions or rulers or authorities—all things were created through him and for him. And he is before all things, and in him all things hold together. And he is the head of the body, the church. He is the beginning, the firstborn from the dead, that in everything he might be preeminent. For in him all the fullness of God was pleased to dwell.",
            translation: "ESV",
            theme: "The Cosmic Preeminence of the Son"
        },
        supportingPassages: [
            {
                reference: "John 1:1-3, 14",
                text: "In the beginning was the Word, and the Word was with God, and the Word was God. He was in the beginning with God. All things were made through him, and without him was not any thing made that was made... And the Word became flesh and dwelt among us, and we have seen his glory, glory as of the only Son from the Father, full of grace and truth.",
                translation: "ESV",
                theme: "The Eternal Word Made Flesh"
            },
            {
                reference: "Hebrews 1:1-3",
                text: "Long ago, at many times and in many ways, God spoke to our fathers by the prophets, but in these last days he has spoken to us by his Son, whom he appointed the heir of all things, through whom also he created the world. He is the radiance of the glory of God and the exact imprint of his nature, and he upholds the universe by the word of his power.",
                translation: "ESV",
                theme: "Radiance of God's Glory & Sustainer of All"
            },
            {
                reference: "Philippians 2:9-11",
                text: "Therefore God has highly exalted him and bestowed on him the name that is above every name, so that at the name of Jesus every knee should bow, in heaven and on earth and under the earth, and every tongue confess that Jesus Christ is Lord, to the glory of God the Father.",
                translation: "ESV",
                theme: "Exaltation of the Universal Lord"
            }
        ],
        strongsTermKeys: ["logos", "kyrios", "monogenes"],
        crossReferences: [
            {
                reference: "Titus 2:13",
                text: "Waiting for our blessed hope, the appearing of the glory of our great God and Savior Jesus Christ.",
                connection: "Explicit apostolic affirmation of Jesus as our great God and Savior."
            }
        ]
    },

    // 5. HOLY SPIRIT & SPIRITUAL GIFTS
    holy_spirit: {
        id: "holy_spirit",
        topic: "The Holy Spirit: Counselor, Guide & Sanctifier",
        keywords: ["holy spirit", "spirit", "paraclete", "comforter", "counselor", "gifts", "fruit", "anointing", "guidance", "conviction", "presence"],
        theologicalSummary: "The Third Person of the Trinity who convicts the world of sin, indwells believers upon regeneration, illuminates Holy Scripture, produces sanctifying fruit, and empowers the Church with spiritual gifts.",
        primaryPassage: {
            reference: "John 14:16-17, 26",
            text: "And I will ask the Father, and he will give you another Helper, to be with you forever, even the Spirit of truth, whom the world cannot receive, because it neither sees him nor knows him. You know him, for he dwells with you and will be in you... But the Helper, the Holy Spirit, whom the Father will send in my name, he will teach you all things and bring to your remembrance all that I have said to you.",
            translation: "ESV",
            theme: "The Promise of the Paraclete"
        },
        supportingPassages: [
            {
                reference: "Romans 8:14-16",
                text: "For all who are led by the Spirit of God are sons of God. For you did not receive the spirit of slavery to fall back into fear, but you have received the Spirit of adoption as sons, by whom we cry, 'Abba! Father!' The Spirit himself bears witness with our spirit that we are children of God.",
                translation: "ESV",
                theme: "Spirit of Adoption & Divine Assurance"
            },
            {
                reference: "Galatians 5:22-25",
                text: "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control; against such things there is no law. And those who belong to Christ Jesus have crucified the flesh with its passions and desires. If we live by the Spirit, let us also keep in step with the Spirit.",
                translation: "ESV",
                theme: "The Fruit of the Spirit"
            },
            {
                reference: "Acts 1:8",
                text: "But you will receive power when the Holy Spirit has come upon you, and you will be my witnesses in Jerusalem and in all Judea and Samaria, and to the end of the earth.",
                translation: "ESV",
                theme: "Pentecostal Power for Gospel Witness"
            }
        ],
        strongsTermKeys: ["parakletos", "pneuma", "ruach"],
        crossReferences: [
            {
                reference: "Ephesians 1:13-14",
                text: "In him you also, when you heard the word of truth, the gospel of your salvation, and believed in him, were sealed with the promised Holy Spirit, who is the guarantee of our inheritance.",
                connection: "The Holy Spirit as the seal and pledge of eternal redemption."
            }
        ]
    },

    // 6. SUFFERING, TRIALS & PROVIDENCE
    suffering_trials: {
        id: "suffering_trials",
        topic: "Suffering, Sovereign Providence & Hope",
        keywords: ["suffering", "trials", "tribulation", "affliction", "pain", "hardship", "providence", "perseverance", "hope", "why god allows", "tragedy"],
        theologicalSummary: "The biblical reality that God sovereignly orders and redeems the suffering of His people for their sanctification, His glory, and an eternal weight of glory that surpasses present momentary affliction.",
        primaryPassage: {
            reference: "Romans 8:28, 31-32",
            text: "And we know that for those who love God all things work together for good, for those who are called according to his purpose... What then shall we say to these things? If God is for us, who can be against us? He who did not spare his own Son but gave him up for us all, how will he not also with him graciously give us all things?",
            translation: "ESV",
            theme: "Sovereign Providence Orchestrating All Things"
        },
        supportingPassages: [
            {
                reference: "2 Corinthians 4:16-18",
                text: "So we do not lose heart. Though our outer self is wasting away, our inner self is being renewed day by day. For this light momentary affliction is preparing for us an eternal weight of glory beyond all comparison, as we look not to the things that are seen but to the things that are unseen. For the things that are seen are transient, but the things that are unseen are eternal.",
                translation: "ESV",
                theme: "Eternal Weight of Glory Surpassing Affliction"
            },
            {
                reference: "James 1:2-4",
                text: "Count it all joy, my brothers, when you meet trials of various kinds, for you know that the testing of your faith produces steadfastness. And let steadfastness have its full effect, that you may be perfect and complete, lacking in nothing.",
                translation: "ESV",
                theme: "Trials Producing Tested Steadfastness"
            },
            {
                reference: "Genesis 50:20",
                text: "As for you, you meant evil against me, but God meant it for good, to bring it about that many people should be kept alive, as they are today.",
                translation: "ESV",
                theme: "God Overruling Human Evil for Redemptive Good"
            }
        ],
        strongsTermKeys: ["hypomone", "thlipsis", "elpis"],
        crossReferences: [
            {
                reference: "1 Peter 1:6-7",
                text: "In this you rejoice, though now for a little while, if necessary, you have been grieved by various trials, so that the tested genuineness of your faith—more precious than gold that perishes though it is tested by fire—may be found to result in praise and glory and honor at the revelation of Jesus Christ.",
                connection: "Faith refined like gold through temporal trials."
            }
        ]
    },

    // 7. ATONEMENT & RECONCILIATION
    atonement: {
        id: "atonement",
        topic: "Substitutionary Atonement & Reconciliation",
        keywords: ["atonement", "cross", "blood", "propitiation", "reconciliation", "sacrifice", "sin", "lamb of god", "forgiven", "redemption"],
        theologicalSummary: "The penal substitutionary sacrifice of Jesus Christ on the cross, where He bore the full wrath of God against sin, canceling the debt of believers and reconciling them to the Father.",
        primaryPassage: {
            reference: "Isaiah 53:4-6",
            text: "Surely he has borne our griefs and carried our sorrows; yet we esteemed him stricken, smitten by God, and afflicted. But he was pierced for our transgressions; he was crushed for our iniquities; upon him was the chastisement that brought us peace, and with his wounds we are healed. All we like sheep have gone astray; we have turned—every one—to his own way; and the Lord has laid on him the iniquity of us all.",
            translation: "ESV",
            theme: "The Suffering Servant Bearing Iniquity"
        },
        supportingPassages: [
            {
                reference: "2 Corinthians 5:18-21",
                text: "All this is from God, who through Christ reconciled us to himself and gave us the ministry of reconciliation; that is, in Christ God was reconciling the world to himself, not counting their trespasses against them... For our sake he made him to be sin who knew no sin, so that in him we might become the righteousness of God.",
                translation: "ESV",
                theme: "The Ministry of Reconciliation and Imputation"
            },
            {
                reference: "1 Peter 2:24",
                text: "He himself bore our sins in his body on the tree, that we might die to sin and live to righteousness. By his wounds you have been healed.",
                translation: "ESV",
                theme: "Bearing Sins on the Tree"
            },
            {
                reference: "Colossians 2:13-14",
                text: "And you, who were dead in your trespasses and the uncircumcision of your flesh, God made alive together with him, having forgiven us all our trespasses, by canceling the record of debt that stood against us with its legal demands. This he set aside, nailing it to the cross.",
                translation: "ESV",
                theme: "The Debt Canceled and Nailed to the Cross"
            }
        ],
        strongsTermKeys: ["hilasmos", "katallage", "apolytrosis"],
        crossReferences: [
            {
                reference: "1 John 2:2",
                text: "He is the propitiation for our sins, and not for ours only but also for the sins of the whole world.",
                connection: "Christ as the expiatory and propitiatory sacrifice turning away wrath."
            }
        ]
    },

    // 8. PRAYER & INTERCESSION
    prayer: {
        id: "prayer",
        topic: "Persistent Prayer, Boldness & Intercession",
        keywords: ["prayer", "pray", "intercession", "supplication", "petition", "ask", "throne of grace", "communion", "intercede", "crying out"],
        theologicalSummary: "The sacred privilege of believers to commune with God the Father through the Son by the Holy Spirit, approaching the throne of grace boldly to receive mercy and find grace in time of need.",
        primaryPassage: {
            reference: "Hebrews 4:14-16",
            text: "Since then we have a great high priest who has passed through the heavens, Jesus, the Son of God, let us hold fast our confession. For we do not have a high priest who is unable to sympathize with our weaknesses, but one who in every respect has been tempted as we are, yet without sin. Let us then with confidence draw near to the throne of grace, that we may receive mercy and find grace to help in time of need.",
            translation: "ESV",
            theme: "Drawing Near to the Throne of Grace with Boldness"
        },
        supportingPassages: [
            {
                reference: "1 Thessalonians 5:16-18",
                text: "Rejoice always, pray without ceasing, give thanks in all circumstances; for this is the will of God in Christ Jesus for you.",
                translation: "ESV",
                theme: "Unceasing Prayer & Thanksgiving"
            },
            {
                reference: "Matthew 6:9-13",
                text: "Pray then like this: 'Our Father in heaven, hallowed be your name. Your kingdom come, your will be done, on earth as it is in heaven. Give us this day our daily bread, and forgive us our debts, as we also have forgiven our debtors. And lead us not into temptation, but deliver us from evil.'",
                translation: "ESV",
                theme: "The Lord's Model Prayer"
            },
            {
                reference: "James 5:16",
                text: "Therefore, confess your sins to one another and pray for one another, that you may be healed. The prayer of a righteous person has great power as it is working.",
                translation: "ESV",
                theme: "The Power of Righteous Intercession"
            }
        ],
        strongsTermKeys: ["proseuche", "deesis", "parrhesia"],
        crossReferences: [
            {
                reference: "Romans 8:26-27",
                text: "Likewise the Spirit helps us in our weakness. For we do not know what to pray for as we ought, but the Spirit himself intercedes for us with groanings too deep for words.",
                connection: "The Holy Spirit interceding according to the will of God in human weakness."
            }
        ]
    },

    // 9. SPIRITUAL WARFARE & THE ARMOR OF GOD
    spiritual_warfare: {
        id: "spiritual_warfare",
        topic: "Spiritual Warfare & The Armor of God",
        keywords: ["warfare", "armor of god", "enemy", "devil", "satan", "demons", "strongholds", "stand firm", "sword of spirit", "shield of faith", "deliverance"],
        theologicalSummary: "The cosmic struggle of believers not against flesh and blood, but against spiritual forces of darkness, waged with divinely empowered spiritual weapons and anchored in Christ's victory.",
        primaryPassage: {
            reference: "Ephesians 6:10-18",
            text: "Finally, be strong in the Lord and in the strength of his might. Put on the whole armor of God, that you may be able to stand against the schemes of the devil. For we do not wrestle against flesh and blood, but against the rulers, against the authorities, against the cosmic powers over this present darkness, against the spiritual forces of evil in the heavenly places. Therefore take up the whole armor of God, that you may be able to withstand in the evil day, and having done all, to stand firm.",
            translation: "ESV",
            theme: "Standing Firm in the Whole Armor of God"
        },
        supportingPassages: [
            {
                reference: "2 Corinthians 10:3-5",
                text: "For though we walk in the flesh, we are not waging war according to the flesh. For the weapons of our warfare are not of the flesh but have divine power to destroy strongholds. We destroy arguments and every lofty opinion raised against the knowledge of God, and take every thought captive to obey Christ.",
                translation: "ESV",
                theme: "Destroying Strongholds & Capturing Thoughts"
            },
            {
                reference: "James 4:7-8",
                text: "Submit yourselves therefore to God. Resist the devil, and he will flee from you. Draw near to God, and he will draw near to you.",
                translation: "ESV",
                theme: "Submission to God & Resistance of the Enemy"
            },
            {
                reference: "1 Peter 5:8-9",
                text: "Be sober-minded; be watchful. Your adversary the devil prowls around like a roaring lion, seeking someone to devour. Resist him, firm in your faith, knowing that the same kinds of suffering are being experienced by your brotherhood throughout the world.",
                translation: "ESV",
                theme: "Vigilance and Resolute Faith Against the Adversary"
            }
        ],
        strongsTermKeys: ["panoplia", "machaira", "katabole"],
        crossReferences: [
            {
                reference: "Colossians 2:15",
                text: "He disarmed the rulers and authorities and put them to open shame, by triumphing over them in him.",
                connection: "Christ's cross as the decisive public triumph over demonic principalities."
            }
        ]
    },

    // 10. WISDOM, GUIDANCE & GOD'S WILL
    wisdom_guidance: {
        id: "wisdom_guidance",
        topic: "Divine Wisdom, Direction & Discerning God's Will",
        keywords: ["wisdom", "guidance", "direction", "will of god", "discernment", "decisions", "path", "leading", "counsel", "understanding"],
        theologicalSummary: "The moral and spiritual discernment given by God through His Word and Spirit, guiding believers to walk in reverent obedience, skill in godly living, and righteous paths.",
        primaryPassage: {
            reference: "Proverbs 3:5-8",
            text: "Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths. Be not wise in your own eyes; fear the Lord, and turn away from evil. It will be healing to your flesh and refreshment to your bones.",
            translation: "ESV",
            theme: "Wholehearted Trust & Straight Paths"
        },
        supportingPassages: [
            {
                reference: "James 1:5-6",
                text: "If any of you lacks wisdom, let him ask God, who gives generously to all without reproach, and it will be given him. But let him ask in faith, with no doubting, for the one who doubts is like a wave of the sea that is driven and tossed by the wind.",
                translation: "ESV",
                theme: "Asking God for Wisdom Generously Bestowed"
            },
            {
                reference: "Psalm 119:105",
                text: "Your word is a lamp to my feet and a light to my path.",
                translation: "ESV",
                theme: "The Illuminating Guidance of Scripture"
            },
            {
                reference: "Romans 12:1-2",
                text: "I appeal to you therefore, brothers, by the mercies of God, to present your bodies as a living sacrifice, holy and acceptable to God, which is your spiritual worship. Do not be conformed to this world, but be transformed by the renewal of your mind, that by testing you may discern what is the will of God, what is good and acceptable and perfect.",
                translation: "ESV",
                theme: "Transformed Mind Discerning God's Will"
            }
        ],
        strongsTermKeys: ["sophia", "chokmah", "phronesis"],
        crossReferences: [
            {
                reference: "Colossians 1:9",
                text: "We have not ceased to pray for you, asking that you may be filled with the knowledge of his will in all spiritual wisdom and understanding.",
                connection: "Paul's petition for spiritual wisdom and full discernment of God's will."
            }
        ]
    },

    // 11. RESURRECTION & ETERNAL LIFE
    resurrection: {
        id: "resurrection",
        topic: "The Resurrection of Jesus Christ & Eternal Life",
        keywords: ["resurrection", "eternal life", "victory over death", "glorification", "grave", "firstfruits", "he is risen", "immortality", "heaven"],
        theologicalSummary: "The historic bodily resurrection of Jesus Christ on the third day, securing the believer's future bodily resurrection, the defeat of death, and the certainty of everlasting life.",
        primaryPassage: {
            reference: "1 Corinthians 15:20-26, 54-57",
            text: "But in fact Christ has been raised from the dead, the firstfruits of those who have fallen asleep. For as by a man came death, by a man has come also the resurrection of the dead. For as in Adam all die, so also in Christ shall all be made alive... When the perishable puts on the imperishable, and the mortal puts on immortality, then shall come to pass the saying that is written: 'Death is swallowed up in victory.' 'O death, where is your victory? O death, where is your sting?' ... But thanks be to God, who gives us the victory through our Lord Jesus Christ.",
            translation: "ESV",
            theme: "Christ the Firstfruits Overcoming Death"
        },
        supportingPassages: [
            {
                reference: "John 11:25-26",
                text: "Jesus said to her, 'I am the resurrection and the life. Whoever believes in me, though he die, yet shall he live, and everyone who lives and believes in me shall never die. Do you believe this?'",
                translation: "ESV",
                theme: "Christ as the Resurrection and Life"
            },
            {
                reference: "1 Peter 1:3-4",
                text: "Blessed be the God and Father of our Lord Jesus Christ! According to his great mercy, he has caused us to be born again to a living hope through the resurrection of Jesus Christ from the dead, to an inheritance that is imperishable, undefiled, and unfading, kept in heaven for you.",
                translation: "ESV",
                theme: "Living Hope Through Christ's Resurrection"
            }
        ],
        strongsTermKeys: ["anastasis", "zoe", "athanasia"],
        crossReferences: [
            {
                reference: "Romans 8:11",
                text: "If the Spirit of him who raised Jesus from the dead dwells in you, he who raised Christ Jesus from the dead will also give life to your mortal bodies through his Spirit who dwells in you.",
                connection: "The indwelling Spirit as the guarantor of bodily resurrection life."
            }
        ]
    },

    // 12. SANCTIFICATION & HOLINESS
    sanctification: {
        id: "sanctification",
        topic: "Sanctification, Holiness & Conformity to Christ",
        keywords: ["sanctification", "holiness", "holy", "purity", "growth", "discipleship", "mortification", "righteous living", "obedience", "consecration"],
        theologicalSummary: "The ongoing, supernatural work of the Holy Spirit delivering the justified believer from the dominion of sin, progressively conforming their heart and life into the moral likeness of Jesus Christ.",
        primaryPassage: {
            reference: "1 Thessalonians 4:3-7",
            text: "For this is the will of God, your sanctification: that you abstain from sexual immorality; that each one of you know how to control his own body in holiness and honor, not in the passion of lust like the Gentiles who do not know God... For God has not called us for impurity, but in holiness.",
            translation: "ESV",
            theme: "The Will of God: Progressive Sanctification"
        },
        supportingPassages: [
            {
                reference: "Romans 6:11-14",
                text: "So you also must consider yourselves dead to sin and alive to God in Christ Jesus. Let not sin therefore reign in your mortal body, to make you obey its passions... For sin will have no dominion over you, since you are not under law but under grace.",
                translation: "ESV",
                theme: "Dead to Sin and Alive Under Grace"
            },
            {
                reference: "2 Corinthians 3:18",
                text: "And we all, with unveiled face, beholding the glory of the Lord, are being transformed into the same image from one degree of glory to another. For this comes from the Lord who is the Spirit.",
                translation: "ESV",
                theme: "Transformation from Glory to Glory"
            },
            {
                reference: "1 Peter 1:15-16",
                text: "But as he who called you is holy, you also be holy in all your conduct, since it is written, 'You shall be holy, for I am holy.'",
                translation: "ESV",
                theme: "The Universal Call to Godly Holiness"
            }
        ],
        strongsTermKeys: ["hagiasmos", "hagios", "kadosh"],
        crossReferences: [
            {
                reference: "Hebrews 12:14",
                text: "Strive for peace with everyone, and for the holiness without which no one will see the Lord.",
                connection: "The indispensable nature of authentic holiness in the believer's walk."
            }
        ]
    },

    // 13. PROVISION, GENEROSITY & STEWARDSHIP
    provision: {
        id: "provision",
        topic: "God's Faithful Provision & Christian Stewardship",
        keywords: ["provision", "finances", "money", "debt", "giving", "generosity", "tithe", "needs", "poverty", "wealth", "stewardship", "daily bread"],
        theologicalSummary: "The sovereign faithfulness of God as the ultimate provider of all temporal and spiritual blessings, inviting believers to generous kingdom stewardship free from the love of money.",
        primaryPassage: {
            reference: "Philippians 4:19-20",
            text: "And my God will supply every need of yours according to his riches in glory in Christ Jesus. To our God and Father be glory forever and ever. Amen.",
            translation: "ESV",
            theme: "All Needs Supplied According to Riches in Glory"
        },
        supportingPassages: [
            {
                reference: "Matthew 6:31-33",
                text: "Therefore do not be anxious, saying, 'What shall we eat?' or 'What shall we drink?' or 'What shall we wear?' For the Gentiles seek after all these things, and your heavenly Father knows that you need them all. But seek first the kingdom of God and his righteousness, and all these things will be added to you.",
                translation: "ESV",
                theme: "Seeking the Kingdom First Above Worldly Worries"
            },
            {
                reference: "2 Corinthians 9:6-8",
                text: "The point is this: whoever sows sparingly will also reap sparingly, and whoever sows bountifully will also reap bountifully. Each one must give as he has decided in his heart, not reluctantly or under compulsion, for God loves a cheerful giver. And God is able to make all grace abound to you, so that having all sufficiency in all things at all times, you may abound in every good work.",
                translation: "ESV",
                theme: "Cheerful Sowing and Abounding Grace"
            }
        ],
        strongsTermKeys: ["chora", "dorea", "ploutos"],
        crossReferences: [
            {
                reference: "1 Timothy 6:6-10",
                text: "Now there is great gain in godliness with contentment, for we brought nothing into the world, and we cannot take anything out of the world... For the love of money is a root of all kinds of evils.",
                connection: "Contentment in godliness guarded against the deceitfulness of riches."
            }
        ]
    },

    // 14. SOVEREIGNTY OF GOD & ELECTION
    sovereignty: {
        id: "sovereignty",
        topic: "The Absolute Sovereignty & Providence of God",
        keywords: ["sovereignty", "sovereign", "control", "predestination", "election", "purpose", "ruler", "king of kings", "almighty", "decree", "omnipotence"],
        theologicalSummary: "The foundational biblical truth that Yahweh reigns supreme over all creation, history, nations, and human destinies, accomplishing His unthwartable redemptive purposes for His eternal glory.",
        primaryPassage: {
            reference: "Ephesians 1:3-6, 11",
            text: "Blessed be the God and Father of our Lord Jesus Christ, who has blessed us in Christ with every spiritual blessing in the heavenly places, even as he chose us in him before the foundation of the world, that we should be holy and blameless before him... In him we have obtained an inheritance, having been predestined according to the purpose of him who works all things according to the counsel of his will.",
            translation: "ESV",
            theme: "The Sovereign Purpose Working All Things"
        },
        supportingPassages: [
            {
                reference: "Isaiah 46:9-10",
                text: "Remember the former things of old; for I am God, and there is no other; I am God, and there is none like me, declaring the end from the beginning and from ancient times things not yet done, saying, 'My counsel shall stand, and I will accomplish all my purpose.'",
                translation: "ESV",
                theme: "Declaring the End from the Beginning"
            },
            {
                reference: "Daniel 4:34-35",
                text: "For his dominion is an everlasting dominion, and his kingdom endures from generation to generation; all the inhabitants of the earth are accounted as nothing, and he does according to his will among the host of heaven and among the inhabitants of the earth; and none can stay his hand or say to him, 'What have you done?'",
                translation: "ESV",
                theme: "The Everlasting Unhindered Dominion of the Most High"
            }
        ],
        strongsTermKeys: ["pantokrator", "kyrieuo", "thelema"],
        crossReferences: [
            {
                reference: "Psalm 115:3",
                text: "Our God is in the heavens; he does all that he pleases.",
                connection: "Succinct biblical declaration of unrestricted divine sovereignty."
            }
        ]
    },

    // 15. MARRIAGE, FAMILY & COVENANT
    family_marriage: {
        id: "family_marriage",
        topic: "Marriage, Parenting & The Covenant Household",
        keywords: ["marriage", "husband", "wife", "children", "family", "parenting", "spouse", "divorce", "covenant home", "purity"],
        theologicalSummary: "Marriage as a sacred, lifelong covenant union between one man and one woman created by God to mirror the sacrificial love of Christ and His bride, the Church.",
        primaryPassage: {
            reference: "Ephesians 5:25, 31-32",
            text: "Husbands, love your wives, as Christ loved the church and gave himself up for her... 'Therefore a man shall leave his father and mother and hold fast to his wife, and the two shall become one flesh.' This mystery is profound, and I am saying that it refers to Christ and the church.",
            translation: "ESV",
            theme: "Marriage Reflecting Christ and the Church"
        },
        supportingPassages: [
            {
                reference: "Genesis 2:24",
                text: "Therefore a man shall leave his father and his mother and hold fast to his wife, and they shall become one flesh.",
                translation: "ESV",
                theme: "Creation Foundation of Covenant Marriage"
            },
            {
                reference: "Deuteronomy 6:6-7",
                text: "And these words that I command you today shall be on your heart. You shall teach them diligently to your children, and shall talk of them when you sit in your house, and when you walk by the way, and when you lie down, and when you rise.",
                translation: "ESV",
                theme: "Discipling Children in the Covenant Home"
            }
        ],
        strongsTermKeys: ["gamos", "agape", "oikos"],
        crossReferences: [
            {
                reference: "Colossians 3:18-21",
                text: "Wives, submit to your husbands, as is fitting in the Lord. Husbands, love your wives, and do not be harsh with them. Children, obey your parents in everything, for this pleases the Lord. Fathers, do not provoke your children, lest they become discouraged.",
                connection: "New covenant household order grounded in mutual honor in Christ."
            }
        ]
    }
};

/**
 * High-precision topical search engine matching user queries to canonical biblical loci.
 * Scans keywords, titles, and theological summaries with weighted token scoring.
 */
export function searchTopicalConcordance(query: string, maxResults: number = 3): TopicalConcordanceEntry[] {
    if (!query || typeof query !== 'string') return [];

    const normalized = query.toLowerCase().trim();
    const queryTokens = normalized.split(/\W+/).filter(t => t.length > 2);

    const scoredEntries = Object.values(TOPICAL_CONCORDANCE).map(entry => {
        let score = 0;

        // Exact topic match
        if (normalized.includes(entry.id) || normalized.includes(entry.topic.toLowerCase())) {
            score += 50;
        }

        // Keyword matches (high weight)
        for (const kw of entry.keywords) {
            if (normalized.includes(kw)) {
                score += 25;
            } else {
                for (const token of queryTokens) {
                    if (kw.includes(token)) score += 8;
                }
            }
        }

        // Summary text search
        const summaryLower = entry.theologicalSummary.toLowerCase();
        for (const token of queryTokens) {
            if (summaryLower.includes(token)) score += 4;
        }

        // Passage text / reference match
        const passageLower = entry.primaryPassage.text.toLowerCase();
        for (const token of queryTokens) {
            if (passageLower.includes(token)) score += 3;
        }

        return { entry, score };
    });

    return scoredEntries
        .filter(item => item.score > 10)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(item => item.entry);
}
