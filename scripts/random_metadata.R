################################################################
## Assign sequences to lab nodes and generate random metadata ##
################################################################

set.seed(1234)

library(tidyverse)
library(randomNames) # Install with install.packages("randomNames")
library(Biostrings) # alignment io, reversing names
library(lubridate) # for decimal dates

seq <- Biostrings::readDNAStringSet("sequences.fasta", format = "fasta")
total <- length(seq)
caucasian <- 0.75
asian <- 0.05
prop_mismatch <- 0.05 # Probability of generating a mismatch

### Step 1: Convert sequence name to genbank ID (a conveneint patch for now) ###
accession_start <- 167298
accession_end <- 167644
accession_prefix <- "MW"
names(seq) <- paste(accession_prefix, accession_start:accession_end, sep = "")

### Step 2: Generate name data using randomNames package ###

# Convenience function to generate names by ethnicity and format them
generate_names <- function(n, ethnicity_code) {
  # Generate random names for a given ethnicity
  randomNames(n, ethnicity = ethnicity_code) %>%
    as_tibble() %>%
    separate(value, into = c("first_name", "last_name"), sep = ", ") %>%
    mutate(
      # Keep only the first two uppercase letters of each name
      first_name = str_to_upper(str_sub(first_name, 1, 2)),
      last_name = str_to_upper(str_sub(last_name, 1, 2))
    )
}

# Generate names for each ethnicity group based on proportions
n_caucasian <- round(total * caucasian)
n_asian <- round(total * asian)
n_other <- total - n_caucasian - n_asian

names <- bind_rows(
  generate_names(n_caucasian, 5), # 5 = Caucasian
  generate_names(n_asian, 2), # 2 = Asian
  generate_names(n_other, sample(c(1, 3, 4, 6), 1)) # Random Other
)

first_name <- names$first_name
last_name <- names$last_name

### Step 3: Generate other metadata ###
sequence_id <- names(seq)

# Dropped at linkage. For now, randomly allocate lab node and append row number
internal_id <- paste0(
  sample(c("LABNODE1", "LABNODE2"), total, replace = TRUE),
  "_", seq_len(total)
)

postcode <- c(
  sample(2000:2300, size = round(total * 0.95), replace = TRUE), # Metropolitan
  sample(2301:2599, size = total - round(total * 0.95), replace = TRUE)
) %>% sample(size = total) # Sample to shuffle

dob <- sample(
  seq(as.Date("1950-01-01"), as.Date("2010-01-01"), by = "day"),
  total,
  replace = TRUE
) %>%
  format("%d/%m/%Y")

date_of_collection <- sample(
  seq(as.Date("2019-01-01"), as.Date("2024-01-01"), by = "day"),
  total,
  replace = TRUE
) %>%
  format("%d/%m/%Y")

# TODO: collection lag
date_of_notification <- sample(
  seq(as.Date("2019-01-01"), as.Date("2024-01-01"), by = "day"),
  total,
  replace = TRUE
) %>%
  format("%d/%m/%Y")

age_at_diagnosis <- floor(
  decimal_date(dmy(date_of_notification)) - decimal_date(dmy(dob))
) %>%
  cut(
    c(0, 9, 19, 29, 39, 49, 59, Inf),
    c("0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60+"),
    include.lowest = TRUE
  )

stage_of_infection <- sample(
  c("Early", "CD4 500+", "CD4 350-499", "CD4 200-349", "Advanced", "Unknown"),
  total,
  replace = TRUE, prob = c(0.3, 0.1, 0.08, 0.01, 0.4, 0.01)
)

subtype <- sample(
  c("B", "CRF01_AE", "C", "Recombinant", "Other"),
  total,
  replace = TRUE,
  prob = c(.5, .2, .1, .1, .1)
)

risk_of_exposure <- sample(
  c("MSM", "HET", "Injection Drug Use", "Other", "Unknown"),
  total,
  replace = TRUE
)

risk_of_exposure <- sample(
  c("MSM", "HET", "Injection Drug Use", "Other", "Unknown"),
  total,
  prob = c(.4, .2, .2, .1, .1),
  replace = TRUE
)

testing_history <- sample(
  c("Neg. or ind. ≤12 months", "Neg. or ind. >12 months", "Never tested before", "Unknown"),
  total,
  replace = TRUE, prob = c(0.35, 0.45, 0.1, 0.1)
)

place_of_birth <- sample(
  c("Australia", "Overseas"),
  total, prob = c(0.4, 0.6), replace = TRUE
)

acquisition <- sample(
  c("Australia", "Overseas", "Unknown"),
  total,
  replace = TRUE, prob = c(0.8, 0.17, 0.03)
)

pathogen <- rep("HIV", times = total)
record_type <- rep("notification", times = total) # Convert to sequence for labs

### Step 4: collate metadata to tibble (which is a fancy data frame) ###
random_metadata <- tibble(
  first_name, last_name, dob, postcode, date_of_collection,
  date_of_notification, place_of_birth, age_at_diagnosis,
  risk_of_exposure, testing_history, acquisition,
  subtype, stage_of_infection, pathogen,
  record_type, internal_id, sequence_id
)

### Step 5: Save PHUNODE1 data. Errors induced for LABNODEs below ###
dir.create("PHUNODE1", showWarnings = FALSE)
random_metadata %>%
  select(-c("date_of_collection", "sequence_id", "subtype")) %>%
  mutate(internal_id = paste("PPN", 1:total, sep = "")) %>%
  write_csv("PHUNODE1/PHUNODE1.csv")

### Step 6: Create errors for lab nodes ###

n_mismatch <- round(nrow(random_metadata) * prop_mismatch)
mismatch_rows <- sample(seq_len(nrow(random_metadata)), n_mismatch)
random_metadata_mismatch <- random_metadata[mismatch_rows, ]

# Reversed names and randomly missing postcodes
# In total 5% will be mismatch.
# Of these, 1/3 first initals are swapped, 1/3 last, 1/3 first and last swapped
first_name_to_reverse <- random_metadata_mismatch$first_name
last_name_to_reverse <- random_metadata_mismatch$last_name

for (i in seq_along(first_name_to_reverse)) {
  rand <- runif(1)

  if (rand < 1 / 3) {
    first_name_to_reverse[i] <- reverse(first_name_to_reverse[i])
  } else if (rand > 1 / 3) {
    last_name_to_reverse[i] <- reverse(last_name_to_reverse[i])
  } else {
    first_name_to_reverse[i] <- reverse(last_name_to_reverse[i])
    last_name_to_reverse[i] <- reverse(first_name_to_reverse[i])
  }
}
random_metadata_mismatch$first_name <- first_name_to_reverse
random_metadata_mismatch$last_name <- last_name_to_reverse

random_metadata[mismatch_rows, ] <- random_metadata_mismatch

### Step 7: Save LABNODE metadata and sequences ###
dir.create("LABNODE1", showWarnings = FALSE)
dir.create("LABNODE2", showWarnings = FALSE)

# Sequences
for (i in seq_along(random_metadata$internal_id)) {
  path <- ifelse(
    grepl("LABNODE1", random_metadata$internal_id[i]),
    "LABNODE1",
    "LABNODE2"
  )
  writeXStringSet(
    seq[i],
    file.path(path, paste0(random_metadata$internal_id[i], ".fasta"))
  )
}

# Metadata
random_metadata %>%
  select(
    internal_id, first_name, last_name, dob, sequence_id,
    date_of_collection, record_type, pathogen
  ) %>%
  mutate(record_type = "sequence") %>%
  filter(grepl("LABNODE1", internal_id)) %>%
  write_csv("LABNODE1/LABNODE1.csv")

random_metadata %>%
  select(
    internal_id, first_name, last_name, dob, sequence_id,
    date_of_collection, record_type, pathogen
  ) %>%
  mutate(record_type = "sequence") %>%
  filter(grepl("LABNODE2", internal_id)) %>%
  write_csv("LABNODE2/LABNODE2.csv")
