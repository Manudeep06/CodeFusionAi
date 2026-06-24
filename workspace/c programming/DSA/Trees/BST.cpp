#include<bits/stdc++.h>
using namespace std;
class Node{
    public :
    int val;
    Node* left;
    Node* right;
    Node(int x){
        val=x;
        left=right=NULL;
    }
};

Node* Bst(vector<int>&a,int i){
    int n=a.size();
    if(i >= n || a[i]==NULL){
        return NULL;
    }
    Node* root=new Node(a[i]);
    root->left=Bst(a,2*i+1);
    root->right=Bst(a,2*i+2);

    return root;
}
// Inorder
void in(Node* root){
    if(root==NULL){
        return;
    }
    in(root->left);
    cout<<root->val<<" ";
    in(root->right);
}
// Preorder
void pre(Node* root){
    if(root==NULL){
        return;
    }
    cout<<root->val<<" ";
    pre(root->left);
    pre(root->right);
}
//Postorder
void post(Node* root){
    if(root==NULL){
        return;
    }
    post(root->left);
    post(root->right);
    cout<<root->val<<" ";
}
int main(){
    vector<int>arr={1,2,3,4,12,6,7,9,10,8,11,NULL,NULL,NULL,14};
    Node* root=Bst(arr,0);
    cout<<"Inorder : ";
    in(root);
    cout<<endl<<"Preorder : ";
    pre(root);
    cout<<endl<<"postorder : ";
    post(root);
}