#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#define MAX_SYMBOLS 50

typedef struct {
    char varName[50];
    char varType[10];
    int varSize;
    unsigned long varAddress;
} SymbolEntry;

unsigned long get_next_address() {
    static unsigned long currAddress = 2020;
    currAddress += 4;
    return currAddress;
}

void insert_symbol(SymbolEntry symTable[], int *symCount, const char *varName, const char *varType) {
    strcpy(symTable[*symCount].varName, varName);
    strcpy(symTable[*symCount].varType, varType);
    symTable[*symCount].varSize = (strcmp(varType, "int") == 0) ? 4 : 0;
    symTable[*symCount].varAddress = get_next_address();
    (*symCount)++;
}

void print_symbol_table(SymbolEntry symTable[], int totalSymbols) {
    printf("Name\tType\tSize\tAddress\n");
    for (int idx = 0; idx < totalSymbols; idx++) {
        printf("%s\t%s\t%d\t%lu\n", symTable[idx].varName, symTable[idx].varType, symTable[idx].varSize, symTable[idx].varAddress);
    }
}

// Helper to clean token (remove =, ; etc.)
void sanitize_token(char *tok) {
    char *eqSign = strchr(tok, '=');
    if (eqSign) *eqSign = '\0';
    char *semicolon = strchr(tok, ';');
    if (semicolon) *semicolon = '\0';
    // Trim trailing whitespace
    int tokLen = strlen(tok);
    while (tokLen > 0 && isspace(tok[tokLen - 1])) {
        tok[tokLen - 1] = '\0';
        tokLen--;
    }
}

int main() {
    char inputFile[100], fileLine[256];
    SymbolEntry symbolTable[MAX_SYMBOLS];
    int symbolTotal = 0;
    printf("Enter Program filename (e.g., sampletext.c):\n");
    scanf("%s", inputFile);
    FILE *filePtr = fopen(inputFile, "r");
    if (!filePtr) {
        printf("Error: Cannot open file %s\n", inputFile);
        return 1;
    }
    while (fgets(fileLine, sizeof(fileLine), filePtr)) {
        if (strstr(fileLine, "int") != NULL && strstr(fileLine, "(") == NULL) {
            char *tok = strtok(fileLine, " ,;\n");
            if (tok != NULL && strcmp(tok, "int") == 0) {
                while ((tok = strtok(NULL, " ,;\n")) != NULL) {
                    sanitize_token(tok);
                    if (strlen(tok) > 0)
                        insert_symbol(symbolTable, &symbolTotal, tok, "int");
                }
            }
        }
    }
    fclose(filePtr);
    print_symbol_table(symbolTable, symbolTotal);
    return 0;
}