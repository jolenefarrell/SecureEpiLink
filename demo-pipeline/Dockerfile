# Base Python image
FROM python:3.11-slim-bookworm


# Install system dependencies
RUN apt-get update && apt-get install -y \
  wget \
  gcc \
  g++ \
  git \
  cmake \ 
  libssl-dev \
  libcurl4-openssl-dev

# Install tn93 using wget
RUN wget -qO- "https://github.com/veg/tn93/archive/refs/tags/v.1.0.11.tar.gz" | tar -zx
RUN echo $(ls -1 .) && \
  cd tn93-* && \
  echo $(ls -1 .) && \
  cmake . && \
  make install && \
  cd .. && \
  rm -rf tn93-*

# Add tn93 to system's PATH
ENV PATH="/opt/tn93/bin:${PATH}"

# Create working directory 
WORKDIR /code

# Install Python dependencies
COPY ./requirements.txt /code/requirements.txt
RUN pip3 install -r requirements.txt

# Install R
# RUN apt-get update && apt-get install -y r-base r-base-dev r-cran-tidyverse

# Install R packages
# RUN R -e "install.packages(c('igraph', 'dplyr', 'knitr', 'tidyverse', 'plotly', 'ape'))"

# Install Quarto 
RUN wget https://github.com/quarto-dev/quarto-cli/releases/download/v1.7.32/quarto-1.7.32-linux-amd64.tar.gz
RUN tar -xzf quarto-1.7.32-linux-amd64.tar.gz
RUN mv quarto-1.7.32 /opt/quarto
RUN rm quarto-1.7.32-linux-amd64.tar.gz

# Add Quarto to system's PATH
ENV PATH="/opt/quarto/bin:${PATH}"

# Verify Quarto installation
# RUN quarto check

# Copy project files from local to image working directory
COPY ./app /code/app

CMD ["fastapi", "dev", "app/main.py","--reload", "--port", "3008", "--host", "0.0.0.0" ]
