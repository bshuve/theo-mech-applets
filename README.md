# theo-mech-applets

## Getting Started

To get started, you will want to do is clone the repository. To do this, go to the directory in which you want to create the repository. Then execute the command:

    git clone https://github.com/bshuve/theo-mech-applets.git
    
Now, enter the directory.

## Step 1: Updating your local repository

The first thing you will want to do is make sure your main branch is up to date. To do this, execute

    git pull origin main
    
You should do this **every** time you want to start something new.

## Step 2: Create new branch and check it out

We now wish to create a separate branch that we can modify at will without messing up the main branch. To do this, execute: 

    git checkout -b my_new_branch
    
where you can pick some descriptive branch name. Any changes you make will now **only** affect your branch, and not the main branch.

## Step 3: Modify or create new files

You can now change any of the existing files, or create new ones. For any files that you have modified or added, you should use the command

    git add my_file_name.py
    
If you want to add all files, you can use

    git add *
    
This tells git that we have modified the files *and* that we want the files to be updated in the main branch when we finally merge everything. 

If you want do delete files from the git repository, use

    git rm file_i_want_to_delete.txt
    
Finally, you can create a file called ".gitignore". This is for keeping track of files in the directory that you *don't* want added to the repository. While you can avoid adding this file to the repository by not using the git add command, sometimes you will accidentally add files that you don't want to commit. If you find this happening, you can add them to .gitignore (or create the file if it doesn't already exist). Simply type each file name on a separate line, and make sure you git add the .gitignore file to add it to the repository!

Once you have staged all of the files you want, execute

    git status
    
to double check you have added the files you want.

## Step 4: Check that the updated code works

This is an important step! It is possible that the changes you have made have broken something. Make sure you have done some tests before you commit the changes to the repository. While it is possible to revert changes that have been made, it makes things quite messy.

## Step 5: Commit the changes to your local repository

This step saves the changes you have made to the local repository. Git is now officially keeping track of the changes you have made, which means you can revert to this checkpoint if you need it later. To do this, execute

    git commit -m "A descriptive comment of the changes you've made"
    
## Step 6: Push the changes to the main repository

Assuming everything goes smoothly, you can now change the main repository. To do this, use the command

    git push -u origin my_new_branch
    
You now need to go to the GitHub repository website (a link will show up in the termainal after you have pushed the changes). A button at the top of the page will say "Create Pull Request", or something to this effect. A pull request is simply an attempt to combine the changes into the existing repository.

Once you have opened the pull request, there will be a short diagnostic where GitHub shows all of the changes you have made. If it is able to seamlessly merge the changes, a green button will appear that says "Merge pull request". This will update the main branch with the changes.

If there is a conflict (which happens if someone has updated the main branch while you are working on the code, and GitHub can no longer automatically implement the changes), then it will demonstrate the source of the conflict before you can merge the pull request. If you don't know what you're doing, this might be a good point at which to ask for help!

## Step 7: Delete local branch and start over

Return to the terminal and execute

    git checkout main
    git pull origin main
    
This returns to the main branch and refreshes the local version with any changes that have been made. 

Once you have checked that your updates have successfully merged, you can then delete your branch using

    git branch -d my_new_branch
    
You are now ready to return to step 2!

## When to commit to the repository

It is likely that you will be working independently on files - in that case, you can periodically commit changes to the repository for backup purposes and so that we can work collaboratively when the code is ready. You should make sure that code is functional when you commit, especially if you are making changes to a file that multiple people are working on. If multiple people are working on the same file, it's best to coordinate so you don't make redundant changes and make sure you commit changes regularly.
