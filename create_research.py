from pathlib import Path
import csv

# Project root
BASE = Path("research")
DOCUMENTS = BASE / "documents"
METADATA = BASE / "metadata"

# Create folders
DOCUMENTS.mkdir(parents=True, exist_ok=True)
METADATA.mkdir(parents=True, exist_ok=True)

# -----------------------------
# Research documents
# -----------------------------

documents = {

"DILRMP_Overview.md": """# Digital India Land Records Modernization Programme (DILRMP)

## Source
Department of Land Resources, Ministry of Rural Development, Government of India.

## Overview
DILRMP aims to modernize land records and develop an integrated land information management system.

The programme supports:
- Real-time land information
- Optimal use of land resources
- Policy and planning
- Reduction of land disputes
- Prevention of fraudulent transactions
- Information sharing between organisations and agencies

## Relevance to BHUMI UDYOG
BHUMI UDYOG complements the land-record modernization ecosystem by providing:
- GIS-based spatial analytics
- Historical land-use analysis
- Machine-learning-based prediction
- Policy scenario simulation
- Research evidence
- Decision-support visualisations

BHUMI UDYOG is a research and decision-support layer and does not replace DILRMP.

## Official Source
https://dolr.gov.in/en/programmes-schemes/dilrmp-2/
""",

"DILRMP_3_0_2026_2031.md": """# DILRMP 3.0 Operational Guidelines (2026–2031)

## Source
Department of Land Resources, Ministry of Rural Development, Government of India.

## Overview
DILRMP 3.0 provides the current policy framework for modernization of land records and land administration for the period 2026–2031.

## Relevance to BHUMI UDYOG
BHUMI UDYOG can complement this ecosystem through:
- Integrated land information analysis
- GIS-based decision support
- Evidence-based planning
- Land-use monitoring
- Predictive analysis
- Policy scenario evaluation

## Platform Alignment
The platform follows the broader objective of using digital technologies and evidence to improve land governance and decision making.

## Official Source
https://dolr.gov.in/en/document/digital-india-land-records-modernization-programmedilrmp-3-0-operational-guidelines-2026-2031/
""",

"NAKSHA.md": """# NAKSHA Programme

## Source
Department of Land Resources, Ministry of Rural Development, Government of India.

## Overview
NAKSHA (National geospatial Knowledge-based land Survey of urban HAbitations) is a geospatial initiative under DILRMP focused on modernising urban land records.

The programme uses geospatial technologies and GIS-integrated digital maps for urban land parcels.

## Relevance to BHUMI UDYOG
BHUMI UDYOG does not replace NAKSHA.

Instead, it can complement land-record systems by providing:
- Land-use change analysis
- Urban expansion analysis
- Predictive modelling
- Policy scenario simulation
- Research evidence
- Decision-support dashboards

## Official Source
https://dolr.gov.in/en/about-naksha/
""",

"LULC_Methodology.md": """# Land Use Land Cover Methodology

## Source
National Remote Sensing Centre (NRSC), ISRO.

## Dataset
The Ghaziabad pilot uses Bhuvan/NRSC LULC information for:
- 2005-06
- 2011-12
- 2015-16

## Methodological Context
NRSC provides 1:50,000 scale LULC information generated using satellite remote sensing data.

## BHUMI UDYOG Processing
For the Ghaziabad pilot:

1. Bhuvan LULC layers were obtained.
2. The data were spatially aligned to a common analysis grid.
3. The rendered LULC data were converted into broad analytical classes.
4. Historical transitions were calculated.
5. A Random Forest transition model was trained.
6. A baseline 2030 projection was generated.
7. Policy scenarios were simulated.

## Analytical Classes
The pilot uses seven broad classes:
1. Built-up
2. Agriculture
3. Forest
4. Grass
5. Barren/Wasteland
6. Water/Wetland
7. Other

## Important Limitation
The pilot classification uses broad analytical classes derived from the rendered Bhuvan LULC representation.

Therefore, these seven classes should NOT be interpreted as the original official NRSC class IDs.

## Official Sources
https://www.nrsc.gov.in/nrscnew/Apps_LULC.php

https://bhuvan-app1.nrsc.gov.in/2dresources/bhuvanstore2.php
""",

"Land_Administration_Research.md": """# Land Administration Research and Policy Innovation

## Source
Department of Land Resources, Ministry of Rural Development, Government of India.

## Research Context
The Department of Land Resources provides research grant guidelines for land administration research.

This creates a policy environment for research, innovation and evidence-based improvements in land governance.

## Relevance to BHUMI UDYOG
BHUMI UDYOG provides a digital research and policy innovation environment where researchers and policymakers can:

- Analyse land-use patterns
- Study historical land-use change
- Develop predictive models
- Compare policy scenarios
- Combine spatial and non-spatial evidence
- Generate evidence-based recommendations
- Produce analytical reports

## Proposed Research Workflow

Data → Analysis → Prediction → Policy Simulation → Evidence → Recommendation

## Official Sources
https://dolr.gov.in/en/document-category/land-administration-guidelines/

https://dolr.gov.in/en/document/revised-guidelins-for-research-grant-for-land-administration/
"""
}

# Write documents
for filename, content in documents.items():
    path = DOCUMENTS / filename
    path.write_text(content, encoding="utf-8")
    print(f"Created: {path}")

# -----------------------------
# Metadata CSV
# -----------------------------

metadata = [
    [
        "R001",
        "DILRMP Overview",
        "Department of Land Resources",
        "Government Policy",
        "Integrated land information and policy planning",
        "https://dolr.gov.in/en/programmes-schemes/dilrmp-2/"
    ],
    [
        "R002",
        "DILRMP 3.0 Operational Guidelines 2026-2031",
        "Department of Land Resources",
        "Government Guidelines",
        "Current land governance modernization framework",
        "https://dolr.gov.in/en/document/digital-india-land-records-modernization-programmedilrmp-3-0-operational-guidelines-2026-2031/"
    ],
    [
        "R003",
        "NAKSHA Programme",
        "Department of Land Resources",
        "Government Programme",
        "GIS-integrated urban land records",
        "https://dolr.gov.in/en/about-naksha/"
    ],
    [
        "R004",
        "Land Use Land Cover",
        "National Remote Sensing Centre ISRO",
        "Geospatial Dataset Methodology",
        "LULC data and classification methodology",
        "https://www.nrsc.gov.in/nrscnew/Apps_LULC.php"
    ],
    [
        "R005",
        "Research Grant for Land Administration",
        "Department of Land Resources",
        "Research Policy",
        "Land administration research and innovation",
        "https://dolr.gov.in/en/document-category/land-administration-guidelines/"
    ]
]

csv_path = METADATA / "research_sources.csv"

with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "id",
        "title",
        "organization",
        "type",
        "relevance",
        "url"
    ])
    writer.writerows(metadata)

print(f"Created: {csv_path}")

print("\nResearch folder created successfully!")
print("\nStructure:")
print("research/")
print("├── documents/")
for filename in documents:
    print(f"│   ├── {filename}")
print("└── metadata/")
print("    └── research_sources.csv")