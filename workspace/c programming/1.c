#include <stdio.h>
#include <stdlib.h>

// Structure to represent a node in the branch and bound tree
struct Node {
    int level;
    int profit;
    int weight;
    int bound;
    struct Node* parent;
    struct Node* left;
    struct Node* right;
};

// Structure to represent items
struct Item {
    int profit;
    int weight;
};

// Function to calculate upper bound
int bound(struct Node u, int n, int W, struct Item items[]) {
    if (u.weight >= W) return 0;

    int profit_bound = u.profit;
    int j = u.level + 1;
    int totweight = u.weight;

    while (j < n && totweight + items[j].weight <= W) {
        totweight += items[j].weight;
        profit_bound += items[j].profit;
        j++;
    }

    if (j < n) {
        profit_bound += (W - totweight) * items[j].profit / items[j].weight;
    }

    return profit_bound;
}

// Function to create a new node
struct Node* newNode(int level, int profit, int weight, int bound, struct Node* parent) {
    struct Node* node = (struct Node*)malloc(sizeof(struct Node));
    node->level = level;
    node->profit = profit;
    node->weight = weight;
    node->bound = bound;
    node->parent = parent;
    node->left = NULL;
    node->right = NULL;
    return node;
}

// Function to generate Graphviz DOT format
void printGraphviz(struct Node* root, FILE* fp) {
    if (root == NULL) return;

    // Create a unique label for the node using its pointer
    fprintf(fp, "    \"%p\" [label=\"L:%d\\nP:%d\\nW:%d\\nB:%d\"];\n",
        (void*)root, root->level, root->profit, root->weight, root->bound);

    if (root->left) {
        fprintf(fp, "    \"%p\" -> \"%p\";\n", (void*)root, (void*)root->left);
        printGraphviz(root->left, fp);
    }
    if (root->right) {
        fprintf(fp, "    \"%p\" -> \"%p\";\n", (void*)root, (void*)root->right);
        printGraphviz(root->right, fp);
    }
}

// Branch and Bound function with tree construction
struct Node* knapsack(int n, int W, struct Item items[], int* maxProfit) {
    *maxProfit = 0;
    struct Node root = {-1, 0, 0, 0, NULL, NULL, NULL};
    root.bound = bound(root, n, W, items);
    struct Node* rootPtr = newNode(-1, 0, 0, root.bound, NULL);
    struct Node* queue[100];
    int front = 0, rear = 0;
    queue[rear++] = rootPtr;

    while (front < rear) {
        struct Node* u = queue[front++];

        if (u->bound > *maxProfit) {
            int j = u->level + 1;
            if (j < n) {
                struct Node* v1 = newNode(j, u->profit + items[j].profit, u->weight + items[j].weight, 0, u);
                v1->bound = bound(*v1, n, W, items);
                if (v1->weight <= W && v1->profit > *maxProfit) {
                    *maxProfit = v1->profit;
                }
                if (v1->bound > *maxProfit) {
                    u->left = v1;
                    queue[rear++] = v1;
                }

                struct Node* v2 = newNode(j, u->profit, u->weight, 0, u);
                v2->bound = bound(*v2, n, W, items);
                if (v2->bound > *maxProfit) {
                    u->right = v2;
                    queue[rear++] = v2;
                }
            }
        }
    }

    return rootPtr;
}

// Function to free the tree memory
void freeTree(struct Node* root) {
    if (root == NULL) return;
    freeTree(root->left);
    freeTree(root->right);
    free(root);
}

int main() {
    int W = 33; // Maximum weight capacity
    struct Item items[] = {{0, 0}, {11, 1}, {21, 11}, {31, 21}, {33, 23}, {43, 33}};
    int n = 6;
    int maxProfit;

    struct Node* root = knapsack(n, W, items, &maxProfit);

    // Output the tree in Graphviz DOT format
    FILE* fp = fopen("tree.dot", "w");
    if (!fp) {
        perror("Failed to open output file");
        return 1;
    }

    fprintf(fp, "digraph G {\n    node [shape=circle, style=filled, color=lightblue, fontname=\"Arial\"];\n");
    printGraphviz(root, fp);
    fprintf(fp, "}\n");
    fclose(fp);

    printf("Tree diagram written to 'tree.dot'\n");
    printf("Maximum profit: %d\n", maxProfit);

    // Free memory
    freeTree(root);

    return 0;
}
