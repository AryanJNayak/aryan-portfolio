"""
Profile routes.

Base path: /api/profile
Purpose:   Serve static profile data (bio, experience, education, skills, links).
           Kept server-side so the frontend has a single source of truth and the
           data can later move to the DB without changing the client.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/profile", tags=["profile"])

# --- Static profile content (sourced from the resume) -----------------------
_PROFILE = {
    "name": "Aryan Nayak",
    "title": "Software Development Engineer",
    "tagline": "SDE Intern @ River Edge Analytics · Full-stack & AI Developer",
    "location": "Ahmedabad, Gujarat, India",
    "email": "aryannayak1509@gmail.com",
    "resume_drive_url": "https://drive.google.com/file/d/1ta8iX_n22AAVxc_X_T0WPChvXOz99mCE/view?usp=drive_link",
    "resume_pdf": "/AryanNayak.pdf",
    "socials": {
        "github": "https://github.com/AryanJNayak",
        "linkedin": "https://www.linkedin.com/in/aryannayak15/",
        "leetcode": "https://leetcode.com/u/Jsjsn73/",
        "geeksforgeeks": "https://www.geeksforgeeks.org/user/aryannayak1509/",
    },
    "experience": [
        {
            "role": "Software Development Intern",
            "company": "River Edge Analytics Pvt. Ltd.",
            "location": "Ahmedabad, Gujarat",
            "start": "January 2026",
            "end": "June 2026",
            "current": True,
            "highlights": [
                "Accomplished a 90% reduction in data ingestion time by implementing batch insertion strategies for large-scale datasets.",
                "Reduced manual accounting efforts by 95% by implementing OCR-based bank transaction extraction.",
                "Reduced annual costs from $200 to near-zero by building an in-house app that replaced a third-party solution.",
                "Improved data accessibility for remote employees by integrating AWS S3 as a secure intermediary layer.",
                "Developed backend services in FastAPI & Python, integrated with React + TypeScript for scalable web apps.",
            ],
        }
    ],
    "education": [
        {
            "degree": "Master of Computer Applications (MCA)",
            "institution": "Lok Jagruti University (L.J. University)",
            "start": "July 2024",
            "end": "June 2026",
            "score": "CGPA: 8.88 / 10.0",
        },
        {
            "degree": "Bachelor of Computer Applications (BCA)",
            "institution": "Gujarat University",
            "start": "July 2021",
            "end": "June 2024",
            "score": "CGPA: 7.97 / 10.0",
        },
    ],
    "skills": {
        "Languages": ["Python", "Java", "C++"],
        "Web": ["React", "React Native", "FastAPI", "Node.js", "Express.js", "Streamlit", "TypeScript"],
        "Databases": ["MongoDB", "MySQL", "SQLite"],
        "Concepts": ["DSA", "Machine Learning", "DBMS", "Operating Systems", "OOP"],
    },
    "achievements": [
        "Globally Top 17% (5737/33040) in LeetCode Weekly Contest 467",
        "Globally Top 25% (6981/27973) in LeetCode Weekly Contest 473",
        "Highest Rating 1492 on LeetCode",
        "Rank 6th (Top 0.5%) on GeeksforGeeks among college peers",
    ],
}


@router.get("")
async def get_profile() -> dict:
    """
    Route:   GET /api/profile
    Purpose: Return the full profile object (bio, experience, education, skills).
    Inputs:  none.
    Output:  dict with all profile sections.
    Example: GET /api/profile
    """
    return _PROFILE
