from fastapi import APIRouter
from app.logger import logger
import subprocess
import json
import shlex


router = APIRouter(
    prefix="/testing",
    tags=["Testing"],
    responses={404: {"description": "Not found"}}
)

# TEST PIPELINE
@router.post("/run/hiv", summary="Run a test pipeline")
async def run_test_pipeline() -> dict:
    """
    Run test HIV pipeline to demonstrate feasibility of running a simple Snakemake workflow.
    """
    logger.info("Request to: /testing/run/hiv")
    # Run snakemake process here
    result = subprocess.run(['snakemake', '--snakefile', 'app/snakes/hiv/simple/v1.0.0/Snakefile', '--cores', 'all' ], capture_output=True, text=True)

    logger.info("Command output:")
    logger.info(result)
    logger.info(f"Exit code: {result.returncode}")

    return {
        "message": "Successfully executed test HIV pipeline"
    }


# KEEP
@router.post("/report/hiv", summary="Generate a test HIV report")
async def run_test_hiv_pipeline() -> dict:
    """
    Run test HIV pipeline to demonstrate feasibility of running a simple Snakemake workflow.
    """
    logger.info("Request to: /testing/report/hiv")
    # Run Quarto report generation process

    # Call quarto render
    result = subprocess.run(
        [
            "quarto",
            "render",
            "app/reports/hiv_demo_report.qmd"
        ],
        capture_output=True,
        text=True
    )

    logger.info("Command output:")
    logger.info(result)
    logger.info(f"Exit code: {result.returncode}")

    return {
        "message": "Successfully generated test HIV report"
    }