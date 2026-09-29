# school-portal
Push
Use these to send local changes to the remote repository:

Push current branch to origin:
git push origin HEAD

Push a specific branch:
git push origin main

Push and set upstream tracking:
git push -u origin main

Push all branches:
git push --all origin

Force push (only if you intentionally want to overwrite remote history):
git push --force origin main

Pull
Use these to get remote changes into your local repo:

Pull the current branch from origin:
git pull origin HEAD

Pull a specific branch:
git pull origin main

Pull and rebase instead of merge:
git pull --rebase origin main

Fetch remote changes without merging:
git fetch origin

Fetch then merge:
git fetch origin
git merge origin/main  nnn