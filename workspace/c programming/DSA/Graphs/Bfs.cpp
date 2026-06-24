#include<bits/stdc++.h>

using namespace std;

int main(){
    int n,m;
    cout<<"Enter the no of nodes :";
    cin>>n;
    cout<<"Enter the no of edges :";
    cin>>m;
    vector<int>adj[n+1];
    cout<<"Enter the edges :"<<endl;
    for(int i=0;i<m;i++){
        int u,v;
        cin>>u>>v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    vector<int> vis(n+1);
    queue<int>q;
    q.push(1);
    vis[1]=1;
    cout<<"BFS Traversel : ";
    while(!q.empty()){
        int x=q.front();
        q.pop();
        vis[x]=1;
        cout<<x<<" ";
        for(int y : adj[x]){
            if(!vis[y]){
                vis[y]=1;
                q.push(y);
            }
        }
    }
}