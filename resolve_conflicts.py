import sys
import os

def resolve_conflicts(path):
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    state = "normal"
    for line in lines:
        if line.startswith("<<<<<<< HEAD"):
            state = "head"
            continue
        if line.startswith("======="):
            state = "other"
            continue
        if line.startswith(">>>>>>>"):
            state = "normal"
            continue
        
        if state == "head" or state == "normal":
            new_lines.append(line)
            
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    resolve_conflicts(sys.argv[1])
