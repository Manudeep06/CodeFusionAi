#include<bits/stdc++.h>
using namespace std;

void dfs(int s,vector<int>adj[],vector<int> &vis,vector<int> &ans){
    vis[s]=1;
    ans.push_back(s);
    for(auto it:adj[s]){
        if(vis[it] != 1)
            dfs(it,adj,vis,ans);
    }

}

vector<int> dfs_traversal(vector<int>adj[] , int v,int n){
    vector<int>vis(n+1);
    vector<int>ans;

    dfs(1,adj,vis,ans);
    return ans;
}

int main(){
    int n,v;
    cout<<"Enter the nodes and edges :";
    cin>>n>>v;
    vector<int>adj[n+1];
    cout<<"Enter edges :";
    for(int i=0;i<v;i++){
        int x,y;
        cin>>x>>y;
        adj[x].push_back(y);
        adj[y].push_back(x);
    }
    vector<int>out =dfs_traversal(adj,v,n);
    cout<<"DFS Traveral :"<<endl;
    for(int i=0;i<out.size();i++){
        cout<<out[i]<<" ";
    }
}