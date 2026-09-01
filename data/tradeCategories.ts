export interface Trade {
    name: string;
    skills: string[];
}

export interface Category {
    name: string;
    trades: Trade[];
}

export interface Sector {
    name: string;
    description: string;
    categories: Category[];
}

export const SECTORS: Sector[] = [
    {
        name: "Building & Construction",
        description: "Focus: Residential, Commercial, Infrastructure projects",
        categories: [
            {
                name: "Structural & Formwork",
                trades: [
                    {
                        name: "Formwork Carpenter",
                        skills: ["System Formwork (Peri/Doka)", "Aluminium Formwork", "Timber Formwork", "Panel Assembly", "Striking/Dismantling", "Shoring/Propping", "Jump Form"]
                    },
                    {
                        name: "Steel Reinforcement (Rebar)",
                        skills: ["Bar Bending Schedule (BBS)", "Manual Bending", "Machine Bending", "Rebar Tying/Fixing", "Spacers Installation", "Pile Cap Work"]
                    },
                    {
                        name: "Precast Installer",
                        skills: ["Precast Erection", "Grouting (Non-shrink)", "Shim Plate Leveling", "Bolt Connection", "Rigging Heavy Loads"]
                    },
                    {
                        name: "Concreter / Paver",
                        skills: ["Screed Operation", "Concrete Vibrating", "Trowel Finishing", "Asphalt Paving", "Interlocking Block Laying"]
                    }
                ]
            },
            {
                name: "Architecture & Finishing",
                trades: [
                    {
                        name: "Mason / Bricklayer",
                        skills: ["Bricklaying", "Blocklaying", "Bonding Patterns", "Pointing", "Mortar Mixing", "Lintels Installation"]
                    },
                    {
                        name: "Plasterer",
                        skills: ["Skim Coating", "Rendering", "Corner Bead Installation", "Screeding (Floor Leveling)", "External Facade"]
                    },
                    {
                        name: "Tiler",
                        skills: ["Ceramic/Porcelain Tiling", "Marble/Granite", "Waterproofing Grout", "Tile Cutting", "Pattern Layout"]
                    },
                    {
                        name: "Drywall / Ceiling Installer",
                        skills: ["Metal Stud Framing", "Gypsum Board Fixing", "Joint Taping & Flushing", "Grid Suspension System", "Acoustical Panels"]
                    },
                    {
                        name: "Painter (Architectural)",
                        skills: ["Surface Preparation (Patching)", "Sealer/Primer Application", "Roller/Brush Finishing", "Texture Coating"]
                    },
                    {
                        name: "Glazier / Facade Installer",
                        skills: ["Curtain Wall Installation", "Spider Fitting", "Glass Handling", "Structural Silicone Sealant", "Window Frame Fixing"]
                    }
                ]
            },
            {
                name: "MEP (Mech, Elec, Plumbing)",
                trades: [
                    {
                        name: "Electrician (Building)",
                        skills: ["PVC/GI Conduit Bending", "Trunking/Tray Installation", "Cable Pulling", "DB Termination", "Lighting & Socket Install"]
                    },
                    {
                        name: "Plumber / Sanitary",
                        skills: ["PVC/PPR Solvent Weld", "Copper Brazing", "Sanitary Ware Install (Basin/WC)", "Leak Testing", "Water Tank Install"]
                    },
                    {
                        name: "Aircon (HVAC) Installer",
                        skills: ["Copper Pipe Swaging/Brazing", "Thermal Insulation (Armaflex)", "VRV/VRF Systems", "Ducting Installation", "Drainage Piping"]
                    },
                    {
                        name: "Fire Protection Installer",
                        skills: ["Sprinkler Dropper Install", "GI Pipe Threading", "Victaulic Coupling", "Hose Reel Install", "Hydro-Testing"]
                    }
                ]
            },
            {
                name: "Heavy Plant Operation",
                trades: [
                    {
                        name: "Crane Operator",
                        skills: ["Tower Crane (Saddle/Luffing)", "Mobile Crane", "Crawler Crane", "Blind Lifting", "Load Chart Calculation", "Radio Comms"]
                    },
                    {
                        name: "Excavator Operator",
                        skills: ["Trenching", "Slope Cutting", "Leveling/Grading", "Rock Breaker Attachment", "Lifting Operation"]
                    }
                ]
            },
            {
                name: "Geotechnical & Piling",
                trades: [
                    {
                        name: "Piling Operator",
                        skills: ["Bored Piling", "Driven Piling", "Jack-in Piling", "Kelly Bar Operation", "Bentonite Fluid Mgmt", "Welding Pile Joints"]
                    }
                ]
            },
            {
                name: "Scaffolding",
                trades: [
                    {
                        name: "Scaffolder (General)",
                        skills: ["Tube & Fitting", "Frame Scaffold", "System Scaffold (Ringlock)", "Erection & Dismantling", "Safety Tagging"]
                    }
                ]
            }
        ]
    },
    {
        name: "Process, Marine & Chemical (PCM)",
        description: "Focus: Oil Refineries, Chemical Plants, Shipyards, Pharma",
        categories: [
            {
                name: "Plant Mechanical",
                trades: [
                    {
                        name: "Rotating Equipment Fitter",
                        skills: ["Laser Alignment (Shaft)", "Mechanical Seal Replacement", "Pump Overhaul", "Vibration Analysis Basics", "Compressor Maintenance"]
                    },
                    {
                        name: "Plant Equipment Fitter (Static)",
                        skills: ["Heat Exchanger Bundle Pulling", "Column Tray Install", "Bolt Torquing/Tensioning", "Gasket Replacement", "Valve Lapping"]
                    },
                    {
                        name: "Workshop Fitter / Machinist",
                        skills: ["Bench Fitting", "Drilling/Tapping", "Manual Lathe Operation", "Fabrication of Brackets/Shims"]
                    }
                ]
            },
            {
                name: "Piping & Instrumentation",
                trades: [
                    {
                        name: "Process Pipefitter",
                        skills: ["Isometric Drawing Reading (Advanced)", "High-Pressure Fit-up", "Pipe Beveling", "Flange Management", "Spool Installation"]
                    },
                    {
                        name: "Instrumentation Technician",
                        skills: ["Small Bore Tubing (Swagelok/Parker)", "Tube Bending", "Pressure Transmitter Install", "Control Valve Calibration", "Loop Checking"]
                    }
                ]
            },
            {
                name: "Electrical (Industrial)",
                trades: [
                    {
                        name: "Electrician (Industrial/Ex)",
                        skills: ["Ex-Rated Glanding (Explosion Proof)", "Armored Cable Termination", "Cable Ladder Fabrication", "Heat Tracing", "Motor Termination"]
                    }
                ]
            },
            {
                name: "Plant Protection",
                trades: [
                    {
                        name: "Blaster / Painter",
                        skills: ["Abrasive Blasting (Grit/Garnet)", "Airless Spray Painting", "Stripe Coating", "WFT/DFT Measurement", "Surface Profile Check"]
                    }
                ]
            },
            {
                name: "Insulation & Refractory",
                trades: [
                    {
                        name: "Thermal Insulator",
                        skills: ["Hot Insulation (Rockwool)", "Cold Insulation (PU Foam)", "Metal Jacketing/Cladding Fabrication", "Pop Riveting"]
                    },
                    {
                        name: "Refractory Mason",
                        skills: ["Firebrick Laying", "Castable Refractory Pouring", "Guniting", "Ceramic Fiber Install", "Anchor Welding"]
                    }
                ]
            },
            {
                name: "Structural & Civil (Plant)",
                trades: [
                    {
                        name: "Plant Civil Worker",
                        skills: ["Equipment Grouting (Epoxy)", "Bund Wall Construction", "Process Drain Maintenance", "Formwork for Plinths"]
                    },
                    {
                        name: "Scaffolder (Process)",
                        skills: ["Scaffolding over Live Pipes", "Hanging Scaffolds (Vessels)", "Cantilever Scaffold", "Confined Space Erection"]
                    }
                ]
            },
            {
                name: "Specialized Lifting & Joining",
                trades: [
                    {
                        name: "Rigger & Signalman",
                        skills: ["Critical Lift Planning", "Chain Block/Lever Hoist Rigging", "Beam Clamp Lifting", "Load Balancing", "Hand/Radio Signals"]
                    },
                    {
                        name: "Welder (Process)",
                        skills: ["GTAW (TIG) Root", "SMAW (Stick) Cap", "6G Position", "Carbon Steel", "Stainless Steel", "Duplex/Exotic Materials", "100% X-Ray"]
                    }
                ]
            }
        ]
    }
];
