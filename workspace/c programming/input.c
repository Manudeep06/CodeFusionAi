#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <stdlib.h>

#define MAX_VARS 100

struct SymEntry {
    char name[100];
    char type[20];
    int size;
    int addr;
};

char *keys[] = {
    "auto","double","int","struct","break","else","long","switch",
    "case","enum","register","typedef","char","extern","return","union",
    "const","short","float","unsigned","continue","for","signed","void",
    "default","goto","sizeof","volatile","do","if","static","while",
    "printf","scanf","main"
};

int is_key(char *tok) {
    for(int i = 0; i < sizeof(keys)/sizeof(keys[0]); i++)
        if(strcmp(tok, keys[i]) == 0)
            return 1;
    return 0;
}

int is_dup(struct SymEntry arr[], int cnt, char *tok) {
    for(int i = 0; i < cnt; i++)
        if(strcmp(arr[i].name, tok) == 0)
            return 1;
    return 0;
}

int main() {
    printf("Enter Program $ for termination:\n");
    
    struct SymEntry vars[MAX_VARS];
    int vc = 0;
    char tok[100], ch, buf[100];
    int bi = 0;
    char curr_type[20] = "";
    int addr = 2024;

    while((ch = getchar()) != EOF && ch != '$') {
        if(isalpha(ch) || ch == '_') {
            buf[bi++] = ch;
        } else {
            buf[bi] = '\0';
            if(bi > 0) {
                if(is_key(buf)) {
                    if(strcmp(buf, "int") == 0 || strcmp(buf, "float") == 0 || 
                       strcmp(buf, "char") == 0 || strcmp(buf, "double") == 0) {
                        strcpy(curr_type, buf);
                    }
                } else if(!is_dup(vars, vc, buf)) {
                    strcpy(vars[vc].name, buf);
                    strcpy(vars[vc].type, curr_type);
                    vars[vc].size = strcmp(curr_type, "double") == 0 ? 8 : 4;
                    vars[vc].addr = addr;
                    addr += 1000;
                    vc++;
                }
            }
            bi = 0;

            if(ch == '"') {
                while((ch = getchar()) != EOF && ch != '"' && ch != '$');
            }
            else if(ch == '/' && getchar() == '/') {
                while((ch = getchar()) != EOF && ch != '\n' && ch != '$');
            }
            else if(ch == '/' && getchar() == '*') {
                while((ch = getchar()) != EOF && ch != '$') {
                    if(ch == '*' && getchar() == '/') break;
                }
            }
        }
    }

    printf("Name\tType\tSize\tAddress\n");
    for(int i = 0; i < vc; i++) {
        printf("%s\t%s\t%d\t%d\n", vars[i].name, vars[i].type, vars[i].size, vars[i].addr);
    }

    return 0;
}