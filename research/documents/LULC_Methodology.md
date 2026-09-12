# Land Use Land Cover Methodology

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
