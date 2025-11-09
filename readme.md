# Emitly

![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastApi](https://img.shields.io/badge/fastapi-109989?style=for-the-badge&logo=FASTAPI&logoColor=white)
![Databricks](https://img.shields.io/badge/Databricks-FF3621?style=for-the-badge&logo=Databricks&logoColor=white)
![SupaBase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)

## Tech Stack
Frontend: React Native + Expo Go
Backend: Python + Fast Api
Database: SupaBase
Datawarehouse: Databricks

## Getting started 
1. Clone the repo
2. Run the following commands
```
cd backend
python -m venv .venv
source .venv/bin/activate/
pip install -r requirements.txt
```
in another terminal
```
cd frontend
chmod a+x scripts/update-env.sh
./update-env.sh
pnpm i
npm run start
```

# Summary 
Emitly lets users keep track of their carbon emissions and stay accountable. With features such as projected individual contrivtuion, as well as AI to give you feedback on your lifestyle, help create a better world and reduce emissions with Emitly. 

## Review
The project is build with react-native in the frontend with expo go, and fast-api interfacing with supabase and databricks. Databricks handles all of our AI and ML, as well as our data warehousing, and supabase handle our users and auth.

Databricks was employed for its ability to run ML models quickly. We were able to add features that allowed users to not only push their data directly into Databricks, but on pushing to trigger a data-pipeline which would train their model and produce new projections based on their entieres keeping their data fresh every day.

![image](/images/image.png)
![image2](/images/Screenshot%202025-11-09%20at%205.05.44 AM.png)


